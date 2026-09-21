export const BRAZIL_STATES = [
  ["AC","Acre"],["AL","Alagoas"],["AP","Amapá"],["AM","Amazonas"],["BA","Bahia"],["CE","Ceará"],["DF","Distrito Federal"],
  ["ES","Espírito Santo"],["GO","Goiás"],["MA","Maranhão"],["MT","Mato Grosso"],["MS","Mato Grosso do Sul"],["MG","Minas Gerais"],
  ["PA","Pará"],["PB","Paraíba"],["PR","Paraná"],["PE","Pernambuco"],["PI","Piauí"],["RJ","Rio de Janeiro"],
  ["RN","Rio Grande do Norte"],["RS","Rio Grande do Sul"],["RO","Rondônia"],["RR","Roraima"],["SC","Santa Catarina"],
  ["SP","São Paulo"],["SE","Sergipe"],["TO","Tocantins"],
] as const;

export type BrazilStateCode = typeof BRAZIL_STATES[number][0];

export function isBrazilStateCode(value: string): value is BrazilStateCode {
  return BRAZIL_STATES.some(([code]) => code === value);
}
