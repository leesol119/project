export const filtersToQuery = (filters) => {
  const params = new URLSearchParams();
  if (filters.roeMin) params.append("roe_min", filters.roeMin);
  if (filters.esg) params.append("esg", filters.esg);
  if (filters.debtMax) params.append("debt_max", filters.debtMax);
  if (filters.equityRatioMin) params.append("equity_ratio_min", filters.equityRatioMin);
  if (filters.epsPositiveOnly) params.append("eps_positive", "true");
  if (filters.allowNegativeEPS) params.append("allow_negative_eps", "true");
  if (filters.duration) params.append("duration", filters.duration);
  if (filters.perMax) params.append('per_max', filters.perMax);
  if (filters.pbrMax) params.append('pbr_max', filters.pbrMax);
  if (filters.dividendMin) params.append('dividend_min', filters.dividendMin);
  if (filters.envFocus) params.append('env_focus', "true");
  if (filters.socFocus) params.append('soc_focus', "true");
  if (filters.govFocus) params.append('gov_focus', "true");
  return params.toString();
};