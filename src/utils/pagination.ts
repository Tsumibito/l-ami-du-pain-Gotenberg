/**
 * Split order lines into pages for PDF generation
 */
export function paginateOrderLines(
  lines: any[],
  hasDemandesSpeciales: boolean = false
): any[] {
  // First page has less lines if there are special demands
  const firstPageLimit = hasDemandesSpeciales ? 8 : 12;
  const otherPagesLimit = 12;
  
  if (lines.length === 0) {
    return [{
      first_page: true,
      lines: []
    }];
  }
  
  const pages: any[] = [];
  let remainingLines = [...lines];
  
  // First page
  const firstPageLines = remainingLines.splice(0, firstPageLimit);
  pages.push({
    first_page: true,
    lines: firstPageLines
  });
  
  // Other pages
  let pageNumber = 2;
  while (remainingLines.length > 0) {
    const pageLines = remainingLines.splice(0, otherPagesLimit);
    pages.push({
      first_page: false,
      page_number: pageNumber,
      total_pages: Math.ceil((lines.length - firstPageLimit) / otherPagesLimit) + 1,
      lines: pageLines
    });
    pageNumber++;
  }
  
  // Update total_pages for all pages
  const totalPages = pages.length;
  pages.forEach(page => {
    page.total_pages = totalPages;
  });
  
  return pages;
}

/**
 * Sort orders by specified mode
 */
export function sortOrders(orders: any[], sortMode: string = 'numero'): any[] {
  const sorted = [...orders];
  
  switch (sortMode) {
    case 'alpha':
      return sorted.sort((a, b) => 
        (a.client_nom || '').localeCompare(b.client_nom || '', 'fr')
      );
    
    case 'numero':
      return sorted.sort((a, b) => 
        (a.numero || '').localeCompare(b.numero || '')
      );
    
    case 'time':
      // Assuming orders are already in time order, or you can add time field
      return sorted;
    
    default:
      return sorted;
  }
}

/**
 * Sort products by specified mode
 */
export function sortProducts(products: any[], sortMode: string = 'alphabetical'): any[] {
  const sorted = [...products];
  
  switch (sortMode) {
    case 'alphabetical':
      return sorted.sort((a, b) => 
        (a.produit_nom || '').localeCompare(b.produit_nom || '', 'fr')
      );
    
    case 'total':
      return sorted.sort((a, b) => 
        (b.total_all || 0) - (a.total_all || 0)
      );
    
    case 'type':
      // Sort by a specific delivery type (need to get the type ID from sortMode)
      return sorted; // Will be implemented based on specific type
    
    default:
      return sorted;
  }
}
