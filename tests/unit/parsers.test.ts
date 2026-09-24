import { describe, it, expect } from 'vitest';
import { parseOFX, parseCSV } from '@/lib/parsers';

describe('Bank Statement Importer Parsers', () => {
  it('deve extrair lançamentos de extrato CSV bancário', () => {
    const sampleCsv = `Data;Descricao;Valor
01/09/2026;MERCADO EXTRA;-150.00
05/09/2026;SALARIO EMPRESA;5000.00`;

    const result = parseCSV(sampleCsv);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].description).toBe('MERCADO EXTRA');
    expect(result[0].amount).toBe(150.00);
    expect(result[0].type).toBe('expense');
  });

  it('deve extrair lançamentos de arquivo OFX', () => {
    const sampleOfx = `<OFX>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260910120000
<TRNAMT>-85.50
<FITID>20260910001
<MEMO>FARMACIA SAO PAULO
</STMTTRN>
</BANKTRANLIST>
</OFX>`;

    const result = parseOFX(sampleOfx);
    expect(result.length).toBe(1);
    expect(result[0].description).toBe('FARMACIA SAO PAULO');
    expect(result[0].amount).toBe(85.50);
    expect(result[0].type).toBe('expense');
    expect(result[0].fitId).toBe('20260910001');
  });
});
