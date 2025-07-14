export function mapFiltersByKeyword(keywords, esgPref) {
  const filters = {
    roeMin: '',
    esg: '',
    debtMax: '',
    equityRatioMin: '',
    perMax: '',
    pbrMax: '',
    dividendMin: '',
    epsPositiveOnly: false,
    allowNegativeEPS: false,
  };

  keywords.forEach((kw) => {
    switch (kw) {
      case '안정형':
        filters.debtMax = 100;
        filters.equityRatioMin = 50;
        filters.epsPositiveOnly = true;
        break;

      case '수익형':
        filters.roeMin = 15;
        filters.epsPositiveOnly = true;
        filters.perMax = 20;
        break;

      case '성장형':
        filters.roeMin = 15;
        filters.epsPositiveOnly = true;
        break;

      case '가치형':
        filters.perMax = 10;
        filters.pbrMax = 1;
        filters.roeMin = 5;
        break;

      case '고배당형':
        filters.dividendMin = 3.0;
        filters.epsPositiveOnly = true;
        filters.perMax = 15;
        break;

      case '단기형':
        filters.roeMin = 10;
        filters.epsPositiveOnly = true;
        filters.perMax = 20;
        break;

        case 'ESG형':
          filters.esg = 'A';
          if (esgPref === 'E(환경)') filters.envFocus = true;
          else if (esgPref === 'S(사회)') filters.socFocus = true;
          else if (esgPref === 'G(지배구조)') filters.govFocus = true;
          break;
        default:
          break;
      }
    });

  return filters;
}