import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

import tailwindConfig from './tailwind.config';

interface QuoteEmailProps {
  quote: {
    id: string;
    quote_number: string;
    client_name: string;
    total: number;
    expires_at: string;
  };
  company: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    logo?: string;
  };
}

export default function QuoteEmail({ quote, company }: QuoteEmailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Html>
      <Head />
      <Preview>New Quote #{quote.quote_number} from {company.name}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="mx-auto my-auto bg-light-concrete px-2 py-10 font-sans">
          <Container className="mx-auto mt-[40px] w-[580px] overflow-hidden rounded-lg bg-paper-white shadow-lg">
            {/* Header Section */}
            <Section className="bg-forest-green px-8 py-6">
              <div className="flex items-center justify-between">
                {company.logo && (
                  <Img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="h-12 w-auto"
                  />
                )}
                <div className="text-right">
                  <Heading className="mb-0 text-2xl font-bold text-paper-white">
                    {company.name}
                  </Heading>
                  <Text className="mb-0 text-sm text-paper-white/70">
                    {company.email}
                  </Text>
                </div>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="px-8 py-6">
              <Heading className="mb-4 text-xl font-semibold text-charcoal">
                Hello {quote.client_name},
              </Heading>
              
              <Text className="mb-6 text-charcoal leading-relaxed">
                Thank you for considering our landscaping services. Please find attached your detailed quote 
                <strong> #{quote.quote_number}</strong> for your review.
              </Text>

              {/* Quote Summary */}
              <Section className="mb-6 rounded-lg border border-stone-gray bg-light-concrete p-4">
                <div className="mb-2">
                  <Text className="mb-1 text-sm font-medium text-charcoal/70">
                    Quote Number
                  </Text>
                  <Text className="mb-0 text-lg font-semibold text-charcoal">
                    #{quote.quote_number}
                  </Text>
                </div>
                <div className="mb-2">
                  <Text className="mb-1 text-sm font-medium text-charcoal/70">
                    Total Amount
                  </Text>
                  <Text className="mb-0 text-2xl font-bold text-forest-green">
                    {formatCurrency(quote.total)}
                  </Text>
                </div>
                <div>
                  <Text className="mb-1 text-sm font-medium text-charcoal/70">
                    Valid Until
                  </Text>
                  <Text className="mb-0 text-base font-medium text-equipment-yellow">
                    {formatDate(quote.expires_at)}
                  </Text>
                </div>
              </Section>

              <Text className="mb-6 text-charcoal leading-relaxed">
                The detailed quote is attached as a PDF with all labor, materials, and landscaping services itemized. Please review it carefully and let us know if you have any questions or need any modifications to better suit your project needs.
              </Text>

              <Text className="mb-6 text-charcoal leading-relaxed">
                We look forward to transforming your outdoor space and working with you on this landscaping project!
              </Text>

              {/* CTA Button */}
              <Section className="text-center">
                <Button
                  href={`${process.env.NEXT_PUBLIC_SITE_URL}/quotes/${quote.id}`}
                  className="rounded-lg bg-forest-green px-6 py-3 font-medium text-paper-white hover:opacity-90"
                >
                  View Quote Online
                </Button>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="border-t border-stone-gray bg-light-concrete px-8 py-4">
              <Text className="mb-2 text-center text-sm text-charcoal">
                Best regards,<br />
                <strong>{company.name}</strong>
              </Text>
              {(company.phone || company.address) && (
                <Text className="mb-0 text-center text-xs text-charcoal/70">
                  {company.phone && `Phone: ${company.phone}`}
                  {company.phone && company.address && ' | '}
                  {company.address}
                </Text>
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}