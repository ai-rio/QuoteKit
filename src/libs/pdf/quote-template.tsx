import React from 'react';

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import { PDFGenerationOptions } from './types';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    paddingTop: 40,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 60,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 5,
  },
  quoteDate: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
  },
  clientSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  clientInfo: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.4,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  tableCellDescription: {
    flex: 3,
  },
  tableCellQuantity: {
    flex: 1,
    textAlign: 'center',
  },
  tableCellPrice: {
    flex: 1,
    textAlign: 'right',
  },
  tableCellTotal: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsContainer: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    fontSize: 11,
    color: '#374151',
  },
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#111827',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
});

export function QuotePDFTemplate({ quote, company }: PDFGenerationOptions) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Calculate tax amount (applied to subtotal only, not including markup)
  const taxAmount = quote.subtotal * (quote.tax_rate / 100);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {company.company_name || 'Your Company Name'}
            </Text>
            {company.company_address && (
              <Text style={styles.companyDetails}>{company.company_address}</Text>
            )}
            {company.company_phone && (
              <Text style={styles.companyDetails}>{company.company_phone}</Text>
            )}
          </View>
          <View>
            <Text style={styles.quoteTitle}>QUOTE</Text>
            <Text style={styles.quoteDate}>
              Date: {formatDate(quote.created_at)}
            </Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Quote For:</Text>
          <Text style={styles.clientInfo}>{quote.client_name}</Text>
          {quote.client_contact && (
            <Text style={styles.clientInfo}>{quote.client_contact}</Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellDescription, { fontWeight: 'bold' }]}>
              Description
            </Text>
            <Text style={[styles.tableCell, styles.tableCellQuantity, { fontWeight: 'bold' }]}>
              Qty
            </Text>
            <Text style={[styles.tableCell, styles.tableCellPrice, { fontWeight: 'bold' }]}>
              Unit Price
            </Text>
            <Text style={[styles.tableCell, styles.tableCellTotal, { fontWeight: 'bold' }]}>
              Total
            </Text>
          </View>
          
          {quote.quote_data.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellDescription]}>
                {item.name}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellQuantity]}>
                {item.quantity} {item.unit}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>
                {formatCurrency(item.cost)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellTotal]}>
                {formatCurrency(item.cost * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text>Subtotal:</Text>
              <Text>{formatCurrency(quote.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Tax ({quote.tax_rate}%):</Text>
              <Text>{formatCurrency(taxAmount)}</Text>
            </View>
            <View style={styles.finalTotalRow}>
              <Text>Total:</Text>
              <Text>{formatCurrency(quote.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This quote is valid for 30 days from the date above.
        </Text>
      </Page>
    </Document>
  );
}