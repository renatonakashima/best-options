## Validação do controle Carteira/P&L

O controle foi encontrado dentro do card Carteira como `#financialVisibilityToggle`, com papel de checkbox e rótulo acessível. Ao alternar para oculto, `#portfolioValue` e `#totalPnL` exibiram `R$ ••••••`, `aria-checked` mudou para `true` e a preferência foi persistida em `localStorage`. Ao alternar novamente, os valores foram restaurados e a preferência voltou para `false`.

