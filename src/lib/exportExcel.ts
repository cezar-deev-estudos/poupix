import * as XLSX from 'xlsx';
import { Transaction, Category, CreditCard, Account } from '@/types/finance';
import { getEffectiveTransactionDate, isSameId } from './invoiceHelpers';
import { normalizeKey } from './decreasingExpenses';

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
  // 1. Preparar itens enriquecidos para possibilitar ordenação
  const enrichedItems = transactions.map(tx => {
    const card = creditCards.find(c => isSameId(c.id, tx.creditCardId));
    const effectiveDateStr = getEffectiveTransactionDate(tx, card);
    const directCat = categories.find(c => isSameId(c.id, tx.categoryId));
    const parentCat = directCat?.parentId ? categories.find(c => isSameId(c.id, directCat.parentId)) : null;

    // Separação Categoria e Subcategoria
    let categoryName = 'Sem Categoria';
    let subcategoryName = '-';

    if (parentCat) {
      // directCat é uma subcategoria filha
      categoryName = parentCat.name;
      subcategoryName = directCat?.name || '-';
    } else if (directCat) {
      // directCat é categoria de nível superior
      categoryName = directCat.name;
      subcategoryName = '-';
    }

    // Identificação de Conta / Cartão
    let accountOrCard = 'Itaú';
    if (tx.type === 'transfer') {
      const fromAcc = accounts.find(a => isSameId(a.id, tx.accountId))?.name || 'Itaú';
      const toAcc = accounts.find(a => isSameId(a.id, tx.destinationAccountId))?.name || 'Itaú';
      accountOrCard = `${fromAcc} -> ${toAcc}`;
    } else if (card) {
      accountOrCard = `Cartão ${card.name}`;
    } else {
      const acc = accounts.find(a => isSameId(a.id, tx.accountId));
      if (acc) {
        accountOrCard = acc.name;
      } else {
        const itau = accounts.find(a =>
          a.name.toLowerCase().includes('itaú') ||
          a.name.toLowerCase().includes('itau')
        );
        accountOrCard = itau?.name || 'Itaú';
      }
    }

    // Tipo formatado e peso de ordenação
    let typeLabel = 'Despesa';
    let typeOrder = 2; // 1 = Receita, 2 = Despesa, 3 = Transferência / Outros

    if (tx.type === 'income') {
      typeLabel = 'Receita';
      typeOrder = 1;
    } else if (tx.type === 'transfer') {
      typeLabel = 'Transferência';
      typeOrder = 3;
    } else if (tx.creditCardId) {
      typeLabel = 'Despesa Cartão';
      typeOrder = 2;
    }

    // Verificação de Nano Categoria (Usado: Sim | Não)
    let isNanoUsed = false;
    const subCatObj = parentCat ? directCat : null;
    const nanos = subCatObj?.nanoCategories || [];

    if (nanos.length > 0) {
      // 1. Checar se alguma tag da transação é o nome de uma nano cadastrada
      if (tx.tags && tx.tags.length > 0) {
        for (const tag of tx.tags) {
          const normTag = normalizeKey(tag);
          if (nanos.some(n => normalizeKey(n.name) === normTag)) {
            isNanoUsed = true;
            break;
          }
        }
      }
      // 2. Checar se a descrição começa ou corresponde ao nome de alguma nano
      if (!isNanoUsed && tx.description) {
        const desc = normalizeKey(tx.description);
        isNanoUsed = nanos.some(n => {
          const nName = normalizeKey(n.name);
          return (
            desc === nName ||
            desc.startsWith(nName + ' ') ||
            desc.startsWith(nName + '-') ||
            desc.startsWith(nName + '/')
          );
        });
      }
    }

    // Cria objeto Date real (em UTC local) para que o Excel interprete como data nativa
    let dateObj: Date | string = effectiveDateStr;
    if (effectiveDateStr && effectiveDateStr.includes('-')) {
      const [y, m, d] = effectiveDateStr.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        dateObj = new Date(Date.UTC(y, m - 1, d));
      }
    }

    return {
      typeOrder,
      categoryName,
      subcategoryName,
      effectiveDateStr,
      excelRow: {
        'Data': dateObj,
        'Situação': tx.paid ? 'Paga' : 'Pendente',
        'Tipo': typeLabel,
        'Descrição': tx.description || 'Lançamento',
        'Categoria': categoryName,
        'Subcategoria': subcategoryName,
        'DF': tx.isFixedCost ? 'Sim' : 'Não',
        'Despesa Decrescente': tx.isDecreasing ? 'Sim' : 'Não',
        'Nano categoria': isNanoUsed ? 'Sim' : 'Não',
        'Conta / Cartão': accountOrCard,
        'Valor (R$)': Number(tx.amount) || 0,
        'Fixa': tx.isRecurring ? 'Sim' : 'Não',
        'Parcelas': tx.installmentTotal ? `${tx.installmentCurrent || 1}/${tx.installmentTotal}` : '',
        'Tags': tx.tags ? tx.tags.join(', ') : '',
        'Observação': tx.notes || '',
        'ID': tx.id,
      },
    };
  });

  // 2. Ordenação das linhas conforme especificação:
  // - Tipo (Receita primeiro, depois Despesa, etc.)
  // - Categoria (Ordem alfabética)
  // - Subcategoria (Ordem alfabética)
  // - Data (Secundária cronológica)
  enrichedItems.sort((a, b) => {
    if (a.typeOrder !== b.typeOrder) {
      return a.typeOrder - b.typeOrder;
    }
    const catComp = a.categoryName.localeCompare(b.categoryName, 'pt-BR');
    if (catComp !== 0) return catComp;

    const subCatComp = a.subcategoryName.localeCompare(b.subcategoryName, 'pt-BR');
    if (subCatComp !== 0) return subCatComp;

    return (a.effectiveDateStr || '').localeCompare(b.effectiveDateStr || '');
  });

  const rows = enrichedItems.map(item => item.excelRow);

  // 3. Criar planilha (Worksheet) com suporte a datas nativas
  const worksheet = XLSX.utils.json_to_sheet(rows, { cellDates: true });

  // 4. Formatar as células de Data (dd/mm/yyyy) e Valor (moeda)
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:O1');

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    // Coluna A (Data, índice 0)
    const dateCellAddress = XLSX.utils.encode_cell({ r: R, c: 0 });
    const dateCell = worksheet[dateCellAddress];
    if (dateCell && (dateCell.t === 'd' || dateCell.v instanceof Date)) {
      dateCell.z = 'dd/mm/yyyy';
    }

    // Coluna K (Valor (R$), índice 10)
    const valueCellAddress = XLSX.utils.encode_cell({ r: R, c: 10 });
    const valueCell = worksheet[valueCellAddress];
    if (valueCell && typeof valueCell.v === 'number') {
      valueCell.z = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
    }
  }

  // Ajustar larguras das colunas para visualização ideal
  worksheet['!cols'] = [
    { wch: 14 }, // Data (A)
    { wch: 12 }, // Situação (B)
    { wch: 16 }, // Tipo (C)
    { wch: 32 }, // Descrição (D)
    { wch: 22 }, // Categoria (E)
    { wch: 22 }, // Subcategoria (F)
    { wch: 8 },  // DF (G)
    { wch: 20 }, // Despesa Decrescente (H)
    { wch: 16 }, // Nano categoria (I)
    { wch: 24 }, // Conta / Cartão (J)
    { wch: 16 }, // Valor (R$) (K)
    { wch: 8 },  // Fixa (L)
    { wch: 10 }, // Parcelas (M)
    { wch: 20 }, // Tags (N)
    { wch: 25 }, // Observação (O)
    { wch: 38 }, // ID (P)
  ];

  // 5. Criar pasta de trabalho (Workbook)
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

  // 6. Fazer o download do arquivo no navegador
  XLSX.writeFile(workbook, fileName, { cellDates: true });
}
