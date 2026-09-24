import { ImportedTransactionPreview, TransactionType } from '@/types/finance';

// Dicionário de regras de auto-categorização inteligente por palavras-chave
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'cat-food': ['restaurante', 'ifood', 'pao de acucar', 'supermercado', 'carrefour', 'mercado', 'padaria', 'lanches', 'mcdonalds', 'burguer', 'cafe', 'bar', 'outback', 'acougue'],
  'cat-housing': ['aluguel', 'condominio', 'enel', 'sabesp', 'cpfl', 'luz', 'energia', 'agua', 'gas', 'iptu', 'imovel', 'internet', 'claro', 'vivo', 'tim'],
  'cat-transport': ['uber', '99app', 'posto', 'gasolina', 'combustivel', 'ipva', 'estacionamento', 'pedagio', 'sem parar', 'veloe', 'auto posto', 'shell', 'ipiranga'],
  'cat-leisure': ['cinema', 'ingresso', 'steam', 'playstation', 'game', 'show', 'teatro', 'viagem', 'airbnb', 'booking', 'hotel'],
  'cat-health': ['drogasil', 'droga raia', 'farmacia', 'drogaria', 'medico', 'consulta', 'laboratorio', 'fleury', 'unimed', 'odontoprev', 'hospital'],
  'cat-education': ['faculdade', 'curso', 'escola', 'livro', 'amazon books', 'udemy', 'coursera', 'alura', 'idiomas'],
  'cat-shopping': ['amazon', 'mercado livre', 'shopee', 'shein', 'zara', 'renner', 'magalu', 'aliexpress', 'loja', 'roupa', 'calcado'],
  'cat-subscriptions': ['netflix', 'spotify', 'prime video', 'youtube', 'apple.com/bill', 'disney', 'hbo', 'globo play', 'deezer'],
  'cat-salary': ['salario', 'ted salario', 'folha de pagamento', 'remuneracao', 'provents', 'ordenado'],
  'cat-invest-inc': ['rendimento', 'dividendos', 'juros', 'cdb', 'fii', 'tesouro direto', 'resgate investimento'],
  'cat-freelance': ['freelance', 'pix recebido', 'transferencia recebida', 'prestacao de servico'],
};

export function autoDetectCategory(description: string, type: TransactionType): string {
  const normalized = description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        return catId;
      }
    }
  }

  return type === 'income' ? 'cat-other-inc' : 'cat-other-exp';
}

/**
 * Parser para arquivos bancários OFX (Open Financial Exchange)
 */
export function parseOFX(ofxContent: string): ImportedTransactionPreview[] {
  const transactions: ImportedTransactionPreview[] = [];

  // Localizar blocos <STMTTRN>...</STMTTRN>
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  while ((match = stmtTrnRegex.exec(ofxContent)) !== null) {
    const block = match[1];

    // Extrair TRNTYPE (DEBIT / CREDIT)
    const typeMatch = /<TRNTYPE>([^<\r\n]+)/i.exec(block);
    const trnType = typeMatch ? typeMatch[1].trim().toUpperCase() : 'OTHER';

    // Extrair DTPOSTED (ex: 20260915120000[-03:EST])
    const dateMatch = /<DTPOSTED>([0-9]{8})/i.exec(block);
    let dateStr = new Date().toISOString().split('T')[0];
    if (dateMatch && dateMatch[1].length === 8) {
      const year = dateMatch[1].substring(0, 4);
      const month = dateMatch[1].substring(4, 6);
      const day = dateMatch[1].substring(6, 8);
      dateStr = `${year}-${month}-${day}`;
    }

    // Extrair TRNAMT (ex: -150.50 ou 2500.00)
    const amtMatch = /<TRNAMT>([^<\r\n]+)/i.exec(block);
    let rawAmount = amtMatch ? parseFloat(amtMatch[1].trim().replace(',', '.')) : 0;
    if (isNaN(rawAmount)) rawAmount = 0;

    const isExpense = rawAmount < 0 || trnType === 'DEBIT';
    const amount = Math.abs(rawAmount);
    const type: TransactionType = isExpense ? 'expense' : 'income';

    // Extrair MEMO ou NAME
    const memoMatch = /<MEMO>([^<\r\n]+)/i.exec(block);
    const nameMatch = /<NAME>([^<\r\n]+)/i.exec(block);
    const description = (memoMatch ? memoMatch[1] : nameMatch ? nameMatch[1] : 'Transação Importada')
      .trim()
      .replace(/\s+/g, ' ');

    // Extrair FITID (identificador único da transação bancária)
    const fitidMatch = /<FITID>([^<\r\n]+)/i.exec(block);
    const fitId = fitidMatch ? fitidMatch[1].trim() : undefined;

    const suggestedCategoryId = autoDetectCategory(description, type);

    transactions.push({
      id: 'import-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      date: dateStr,
      description,
      amount,
      type,
      suggestedCategoryId,
      selected: true,
      fitId,
    });
  }

  return transactions;
}

/**
 * Parser flexível para arquivos CSV bancários (Nubank, Inter, Itaú, Bradesco, etc.)
 */
export function parseCSV(csvContent: string): ImportedTransactionPreview[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) return [];

  // Detectar separador (, ou ;)
  const header = lines[0];
  const separator = header.includes(';') ? ';' : ',';
  const headers = header.split(separator).map(h => h.trim().toLowerCase().replace(/"/g, ''));

  // Identificar índices das colunas
  let dateIndex = headers.findIndex(h => h.includes('data') || h.includes('date'));
  let descIndex = headers.findIndex(h => h.includes('desc') || h.includes('titulo') || h.includes('historico') || h.includes('memo') || h.includes('detalhe'));
  let amountIndex = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('quantia'));

  if (dateIndex === -1) dateIndex = 0;
  if (descIndex === -1) descIndex = 1;
  if (amountIndex === -1) amountIndex = 2;

  const results: ImportedTransactionPreview[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
    if (rawCols.length <= 1) continue;

    const rawDate = rawCols[dateIndex] || '';
    const rawDesc = rawCols[descIndex] || 'Lançamento CSV';
    const rawVal = rawCols[amountIndex] || '0';

    // Normalizar data (formatos comuns: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY)
    let formattedDate = new Date().toISOString().split('T')[0];
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          // DD/MM/YYYY
          formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    } else if (rawDate.includes('-') && rawDate.split('-')[0].length === 4) {
      formattedDate = rawDate;
    }

    // Normalizar valor (ex: "1.250,50", "-150.00", "150,00", "R$ 45,90")
    let cleanValStr = rawVal.replace(/[R$\s]/g, '');
    
    if (cleanValStr.includes(',') && cleanValStr.includes('.')) {
      // Ex: 1.250,50 -> 1250.50
      cleanValStr = cleanValStr.replace(/\./g, '').replace(',', '.');
    } else if (cleanValStr.includes(',')) {
      // Ex: 150,00 -> 150.00
      cleanValStr = cleanValStr.replace(',', '.');
    }
    
    let numVal = parseFloat(cleanValStr);
    if (isNaN(numVal)) continue;

    const isExpense = numVal < 0 || rawVal.includes('-');
    const amount = Math.abs(numVal);
    const type: TransactionType = isExpense ? 'expense' : 'income';

    const suggestedCategoryId = autoDetectCategory(rawDesc, type);

    results.push({
      id: 'import-csv-' + Date.now() + '-' + i + '-' + Math.random().toString(36).substring(2, 5),
      date: formattedDate,
      description: rawDesc,
      amount,
      type,
      suggestedCategoryId,
      selected: true,
    });
  }

  return results;
}
