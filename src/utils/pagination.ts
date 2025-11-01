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
  while (remainingLines.length > 0) {
    const pageLines = remainingLines.splice(0, otherPagesLimit);
    pages.push({
      first_page: false,
      lines: pageLines
    });
  }
  
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
