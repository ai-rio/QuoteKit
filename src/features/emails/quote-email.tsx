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
        <Body className="mx-auto my-auto bg-gray-50 px-2 py-10 font-sans">
          <Container className="mx-auto mt-[40px] w-[580px] overflow-hidden rounded-lg bg-white shadow-lg">
            {/* Header Section */}
            <Section className="bg-slate-900 px-8 py-6">
              <div className="flex items-center justify-between">
                {company.logo && (
                  <Img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="h-12 w-auto"
                  />
                )}
                <div className="text-right">
                  <Heading className="mb-0 text-2xl font-bold text-white">
                    {company.name}
                  </Heading>
                  <Text className="mb-0 text-sm text-gray-300">
                    {company.email}
                  </Text>
                </div>
              </div>
            </Section>

            {/* Main Content */}
            <Section className="px-8 py-6">
              <Heading className="mb-4 text-xl font-semibold text-gray-900">
                Hello {quote.client_name},
              </Heading>
              
              <Text className="mb-6 text-gray-700 leading-relaxed">
                Thank you for your interest in our services. Please find attached your quote 
                <strong> #{quote.quote_number}</strong> for your review.
              </Text>

              {/* Quote Summary */}
              <Section className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2">
                  <Text className="mb-1 text-sm font-medium text-gray-600">
                    Quote Number
                  </Text>
                  <Text className="mb-0 text-lg font-semibold text-gray-900">
                    #{quote.quote_number}
                  </Text>
                </div>
                <div className="mb-2">
                  <Text className="mb-1 text-sm font-medium text-gray-600">
                    Total Amount
                  </Text>
                  <Text className="mb-0 text-2xl font-bold text-green-600">
                    {formatCurrency(quote.total)}
                  </Text>
                </div>
                <div>
                  <Text className="mb-1 text-sm font-medium text-gray-600">
                    Valid Until
                  </Text>
                  <Text className="mb-0 text-base font-medium text-red-600">
                    {formatDate(quote.expires_at)}
                  </Text>
                </div>
              </Section>

              <Text className="mb-6 text-gray-700 leading-relaxed">
                The detailed quote is attached as a PDF. Please review it carefully and 
                let us know if you have any questions or need any modifications.
              </Text>

              <Text className="mb-6 text-gray-700 leading-relaxed">
                We look forward to working with you on this project!
              </Text>

              {/* CTA Button */}
              <Section className="text-center">
                <Button
                  href={`${process.env.NEXT_PUBLIC_SITE_URL}/quotes/${quote.id}`}
                  className="rounded-lg bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
                >
                  View Quote Online
                </Button>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="border-t border-gray-200 bg-gray-50 px-8 py-4">
              <Text className="mb-2 text-center text-sm text-gray-600">
                Best regards,<br />
                <strong>{company.name}</strong>
              </Text>
              {(company.phone || company.address) && (
                <Text className="mb-0 text-center text-xs text-gray-500">
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