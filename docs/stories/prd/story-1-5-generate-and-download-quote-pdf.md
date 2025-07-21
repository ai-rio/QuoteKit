# Story 1.5: Generate and Download Quote PDF

As a logged-in user,  
I want to generate a professional PDF of my completed quote,  
so that I can download it and send it to my client.  

## Acceptance Criteria

1. On the "Create Quote" page, there is a clear and prominent button labeled "Generate PDF" or similar.  
2. Clicking the button triggers the generation of a PDF document.  
3. The generated PDF must be professionally formatted and include:  
   * The user's company name, logo, and contact information (from Story 1.2).  
   * The client's name and contact information (from Story 1.4).  
   * An itemized list of all services/materials with quantities, unit prices, and line totals.  
   * A clear breakdown of the subtotal, tax amount, and the final total.  
4. The system should not include the user's internal profit markup on the client-facing PDF.  
5. Upon successful generation, the user's browser prompts them to download the PDF file.  
6. The downloaded file is a valid, non-corrupted PDF that can be opened by standard PDF readers.