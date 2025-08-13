-- Create PDF Templates System for Quote PDF Generation
-- Supports template caching, customization, and version control

-- Create pdf_templates table
CREATE TABLE IF NOT EXISTS pdf_templates (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name text NOT NULL,
    description text,
    html_template text NOT NULL,
    css_styles text NOT NULL DEFAULT '',
    is_default boolean DEFAULT false,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid, -- For multi-tenant support
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS pdf_templates_user_id_idx ON pdf_templates(user_id);
CREATE INDEX IF NOT EXISTS pdf_templates_is_default_idx ON pdf_templates(is_default);
CREATE INDEX IF NOT EXISTS pdf_templates_company_id_idx ON pdf_templates(company_id);

-- Create pdf_generation_logs table for tracking and debugging
CREATE TABLE IF NOT EXISTS pdf_generation_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    quote_id uuid, -- Reference to quotes table (soft reference)
    template_id text REFERENCES pdf_templates(id) ON DELETE SET NULL,
    generation_type text NOT NULL CHECK (generation_type IN ('single', 'batch')),
    status text NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    file_size_kb integer,
    generation_time_ms integer,
    storage_path text,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for pdf_generation_logs
CREATE INDEX IF NOT EXISTS pdf_generation_logs_user_id_idx ON pdf_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS pdf_generation_logs_quote_id_idx ON pdf_generation_logs(quote_id);
CREATE INDEX IF NOT EXISTS pdf_generation_logs_status_idx ON pdf_generation_logs(status);
CREATE INDEX IF NOT EXISTS pdf_generation_logs_created_at_idx ON pdf_generation_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pdf_template_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS pdf_templates_updated_at_trigger ON pdf_templates;
CREATE TRIGGER pdf_templates_updated_at_trigger
    BEFORE UPDATE ON pdf_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_template_updated_at();

-- Insert default template
INSERT INTO pdf_templates (
    id,
    name,
    description,
    html_template,
    css_styles,
    is_default,
    user_id
) VALUES (
    'default',
    'Default Quote Template',
    'Standard quote template with company branding support',
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote {{quote_number}}</title>
</head>
<body>
    <div class="quote-container">
        <header class="quote-header">
            <h1>Quote {{quote_number}}</h1>
            <div class="quote-info">
                <p><strong>Date:</strong> {{quote_date}}</p>
                <p><strong>Valid Until:</strong> {{valid_until}}</p>
                <p><strong>Status:</strong> {{status}}</p>
            </div>
        </header>

        <section class="client-info">
            <h2>Client Information</h2>
            <p><strong>Name:</strong> {{client_name}}</p>
            <p><strong>Email:</strong> {{client_email}}</p>
            <p><strong>Phone:</strong> {{client_phone}}</p>
            <p><strong>Address:</strong> {{client_address}}</p>
        </section>

        <section class="line-items">
            <h2>Services & Materials</h2>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{line_items}}
                </tbody>
            </table>
        </section>

        <section class="quote-totals">
            <table class="totals-table">
                <tr>
                    <td><strong>Subtotal:</strong></td>
                    <td>{{subtotal}}</td>
                </tr>
                <tr>
                    <td><strong>Tax ({{tax_rate}}):</strong></td>
                    <td>{{tax_amount}}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Total:</strong></td>
                    <td><strong>{{total}}</strong></td>
                </tr>
            </table>
        </section>

        <section class="notes">
            <h2>Notes</h2>
            <p>{{notes}}</p>
        </section>
    </div>
</body>
</html>',
    'body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        color: #333;
        line-height: 1.6;
    }
    
    .quote-container {
        max-width: 800px;
        margin: 0 auto;
    }
    
    .quote-header {
        border-bottom: 2px solid #007bff;
        padding-bottom: 20px;
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .quote-header h1 {
        color: #007bff;
        margin: 0;
    }
    
    .quote-info p {
        margin: 5px 0;
    }
    
    .client-info, .line-items, .notes {
        margin-bottom: 30px;
    }
    
    .client-info h2, .line-items h2, .notes h2 {
        color: #007bff;
        border-bottom: 1px solid #ddd;
        padding-bottom: 10px;
    }
    
    .items-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }
    
    .items-table th, .items-table td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
    }
    
    .items-table th {
        background-color: #f8f9fa;
        font-weight: bold;
    }
    
    .quote-totals {
        float: right;
        width: 300px;
    }
    
    .totals-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .totals-table td {
        padding: 8px;
        border-bottom: 1px solid #ddd;
    }
    
    .total-row {
        border-top: 2px solid #007bff;
        font-size: 1.2em;
    }
    
    .total-row td {
        border-bottom: 2px solid #007bff;
        padding: 12px 8px;
    }
    
    @media print {
        body {
            margin: 0;
            padding: 15px;
        }
        
        .quote-container {
            max-width: none;
        }
    }',
    true,
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Create RPC functions for PDF template management

-- Function to get or create default template for user
CREATE OR REPLACE FUNCTION get_or_create_user_template(
    p_user_id uuid,
    p_template_id text DEFAULT 'default'
)
RETURNS pdf_templates AS $$
DECLARE
    template_record pdf_templates;
BEGIN
    -- Try to get user-specific template
    SELECT * INTO template_record
    FROM pdf_templates
    WHERE id = p_template_id AND (user_id = p_user_id OR is_default = true)
    LIMIT 1;
    
    -- If not found, get default template
    IF NOT FOUND THEN
        SELECT * INTO template_record
        FROM pdf_templates
        WHERE is_default = true
        LIMIT 1;
    END IF;
    
    RETURN template_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log PDF generation
CREATE OR REPLACE FUNCTION log_pdf_generation(
    p_user_id uuid,
    p_quote_id uuid,
    p_template_id text,
    p_generation_type text,
    p_status text,
    p_file_size_kb integer DEFAULT NULL,
    p_generation_time_ms integer DEFAULT NULL,
    p_storage_path text DEFAULT NULL,
    p_error_message text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO pdf_generation_logs (
        user_id,
        quote_id,
        template_id,
        generation_type,
        status,
        file_size_kb,
        generation_time_ms,
        storage_path,
        error_message,
        metadata
    ) VALUES (
        p_user_id,
        p_quote_id,
        p_template_id,
        p_generation_type,
        p_status,
        p_file_size_kb,
        p_generation_time_ms,
        p_storage_path,
        p_error_message,
        p_metadata
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get PDF generation statistics
CREATE OR REPLACE FUNCTION get_pdf_generation_stats(
    p_user_id uuid,
    p_days_back integer DEFAULT 30
)
RETURNS jsonb AS $$
DECLARE
    stats jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_generated', COUNT(*),
        'successful', COUNT(*) FILTER (WHERE status = 'success'),
        'failed', COUNT(*) FILTER (WHERE status = 'failed'),
        'average_generation_time_ms', AVG(generation_time_ms) FILTER (WHERE generation_time_ms IS NOT NULL),
        'average_file_size_kb', AVG(file_size_kb) FILTER (WHERE file_size_kb IS NOT NULL),
        'total_size_mb', ROUND(SUM(file_size_kb) FILTER (WHERE file_size_kb IS NOT NULL) / 1024.0, 2)
    ) INTO stats
    FROM pdf_generation_logs
    WHERE user_id = p_user_id
    AND created_at > (now() - (p_days_back || ' days')::interval);
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up Row Level Security (RLS)
ALTER TABLE pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_templates
CREATE POLICY "Users can view default templates and their own templates" ON pdf_templates
    FOR SELECT USING (is_default = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own templates" ON pdf_templates
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates" ON pdf_templates
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates" ON pdf_templates
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for pdf_generation_logs
CREATE POLICY "Users can view their own PDF generation logs" ON pdf_generation_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert PDF generation logs" ON pdf_generation_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pdf_templates TO authenticated;
GRANT SELECT, INSERT ON pdf_generation_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_user_template(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION log_pdf_generation(uuid, uuid, text, text, text, integer, integer, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pdf_generation_stats(uuid, integer) TO authenticated;

-- Create storage bucket for PDF files if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('documents', 'documents')
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add helpful comments
COMMENT ON TABLE pdf_templates IS 'PDF templates for quote generation with customization support';
COMMENT ON TABLE pdf_generation_logs IS 'Audit log for PDF generation operations with performance metrics';
COMMENT ON FUNCTION get_or_create_user_template(uuid, text) IS 'Get user-specific or default PDF template';
COMMENT ON FUNCTION log_pdf_generation(uuid, uuid, text, text, text, integer, integer, text, text, jsonb) IS 'Log PDF generation operation for auditing and performance tracking';
COMMENT ON FUNCTION get_pdf_generation_stats(uuid, integer) IS 'Get PDF generation statistics for user over specified time period';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'PDF Templates System created successfully!';
    RAISE NOTICE 'Created tables: pdf_templates, pdf_generation_logs';
    RAISE NOTICE 'Created functions: get_or_create_user_template, log_pdf_generation, get_pdf_generation_stats';
    RAISE NOTICE 'Created storage bucket: documents';
    RAISE NOTICE 'Set up RLS policies for security';
END $$;