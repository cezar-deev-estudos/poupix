import * as XLSX from 'xlsx';
import { Transaction, Category, CreditCard, Account } from '@/types/finance';
import { getEffectiveTransactionDate, isSameId } from './invoiceHelpers';

export interface ExportExcelOptions {
  fileName?: string;
  transactions: Transaction[];
  categories: Category[];
  creditCards: CreditCard[];
  accounts: Account[];
}

export function exportTransactionsToExcel({
  fileName = 'transacoes_poupix.xlsx',
  transactions,
  categories,
  creditCards,
  accounts,
}: ExportExcelOptions) {
  // 1. Mapear transações para linhas estruturadas com Data nativa (Date)
  const rows = transactions.map(tx => {
    const card = creditCards.find(c => isSameId(c.id, tx.creditCardId));
    const effectiveDateStr = getEffectiveTransactionDate(tx, card);
    const directCat = categories.find(c => isSameId(c.id, tx.categoryId));
    const parentCat = directCat?.parentId ? categories.find(c => isSameId(c.id, directCat.parentId)) : null;

    let categoryLabel = directCat?.name || 'Sem Categoria';
    if (parentCat) {
      categoryLabel = `${parentCat.name} / ${directCat?.name}`;
    }

    let accountOrCard = 'Conta';
    if (tx.type === 'transfer') {
      const fromAcc = accounts.find(a => isSameId(a.id, tx.accountId))?.name || 'Conta';
      const toAcc = accounts.find(a => isSameId(a.id, tx.destinationAccountId))?.name || 'Conta';
      accountOrCard = `${fromAcc} -> ${toAcc}`;
    } else if (card) {
      accountOrCard = `Cartão ${card.name}`;
    } else {
      const acc = accounts.find(a => isSameId(a.id, tx.accountId));
      if (acc) accountOrCard = acc.name;
    }

    let typeLabel = 'Despesa';
    if (tx.type === 'income') typeLabel = 'Receita';
    else if (tx.type === 'transfer') typeLabel = 'Transferência';
    else if (tx.creditCardId) typeLabel = 'Despesa Cartão';

    // Cria objeto Date real (em UTC local) para que o Excel interprete como data nativa
    let dateObj: Date | string = effectiveDateStr;
    if (effectiveDateStr && effectiveDateStr.includes('-')) {
      const [y, m, d] = effectiveDateStr.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        dateObj = new Date(Date.UTC(y, m - 1, d));
      }
    }

    return {
      'Data': dateObj,
      'Situação': tx.paid ? 'Paga' : 'Pendente',
      'Tipo': typeLabel,
      'Descrição': tx.description || 'Lançamento',
      'Categoria': categoryLabel,
      'Conta / Cartão': accountOrCard,
      'Valor (R$)': Number(tx.amount) || 0,
      'Fixa': tx.isRecurring ? 'Sim' : 'Não',
      'Parcelas': tx.installmentTotal ? `${tx.installmentCurrent || 1}/${tx.installmentTotal}` : '',
      'Tags': tx.tags ? tx.tags.join(', ') : '',
      'Observação': tx.notes || '',
    };
  });

  // 2. Criar planilha (Worksheet) com suporte a datas nativas
  const worksheet = XLSX.utils.json_to_sheet(rows, { cellDates: true });

  // 3. Formatar as células de Data (dd/mm/yyyy) e Valor (moeda)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:K1');

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    // Coluna A (Data, índice 0)
    const dateCellAddress = XLSX.utils.encode_cell({ r: R, c: 0 });
    const dateCell = worksheet[dateCellAddress];
    if (dateCell && (dateCell.t === 'd' || dateCell.v instanceof Date)) {
      dateCell.z = 'dd/mm/yyyy';
    }

    // Coluna G (Valor, índice 6)
    const valueCellAddress = XLSX.utils.encode_cell({ r: R, c: 6 });
    const valueCell = worksheet[valueCellAddress];
    if (valueCell && typeof valueCell.v === 'number') {
      valueCell.z = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
    }
  }

  // Ajustar larguras das colunas para visualização ideal
  worksheet['!cols'] = [
    { wch: 14 }, // Data
    { wch: 12 }, // Situação
    { wch: 16 }, // Tipo
    { wch: 32 }, // Descrição
    { wch: 25 }, // Categoria
    { wch: 24 }, // Conta / Cartão
    { wch: 16 }, // Valor (R$)
    { wch: 8 },  // Fixa
    { wch: 10 }, // Parcelas
    { wch: 20 }, // Tags
    { wch: 25 }, // Observação
  ];

  // 4. Criar pasta de trabalho (Workbook)
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

  // 5. Fazer o download do arquivo no navegador
  XLSX.writeFile(workbook, fileName, { cellDates: true });
}
