# Fontes verificadas para o card do Ibovespa

## Google Finance

URL: https://www.google.com/finance/quote/IBOV:INDEXBVMF?hl=pt-BR

A página do Google Finance identifica o instrumento como `IBOV:INDEXBVMF` e exibe cotação, variação percentual, variação em pontos, fechamento anterior e períodos de gráfico. A leitura direta a partir do GitHub Pages foi testada e bloqueada pelo navegador por CORS; por isso, o site deve manter um link de conferência para o Google Finance, sem depender de scraping client-side.

## Google Sheets GOOGLEFINANCE

URL: https://support.google.com/docs/answer/3093281?hl=pt-BR

A documentação do Google informa que `GOOGLEFINANCE` fornece cotações em tempo real com atraso de até 20 minutos e dados históricos diários, mas também informa que os dados históricos não podem ser acessados pela API Sheets ou Apps Script. Essa opção exigiria uma configuração adicional do usuário e não foi escolhida nesta implementação.

## TradingView Widgets

URLs:
- https://www.tradingview.com/widget-docs/widgets/charts/symbol-overview/
- https://www.tradingview.com/blog/en/b3-data-available-in-tradingview-widgets-41743/
- https://www.tradingview.com/symbols/BMFBOVESPA-IBOV/

A documentação do TradingView descreve o widget Symbol Overview para incorporar cotações e gráfico. O anúncio sobre B3 informa que ações, índices e futuros da B3 podem ser exibidos gratuitamente nos widgets com atraso de 15 minutos, usando símbolos como `BMFBOVESPA:IBOV`. Esta é a fonte pública alternativa escolhida para o card, por funcionar em uma página estática sem chave de API e por disponibilizar cotação, variação e gráfico em um componente incorporado.

## B3

URL: https://www.b3.com.br/en_us/market-data-and-indices/indices/broad-indices/ibovespa.htm

A B3 descreve o Ibovespa como o principal indicador de desempenho das ações negociadas na B3.

## Decisão de implementação

Usar o widget público do TradingView com o símbolo `BMFBOVESPA:IBOV`, configuração de intervalo diário e janela de uma semana, dentro do card do dashboard. O card incluirá link para conferência no Google Finance e aviso de que as cotações podem ter atraso. Não será usada uma falsa API do Google nem scraping de uma página cross-origin.

## Validação local do widget

O dashboard local exibiu o card `Ibovespa` à direita do card P&L, com link de conferência no Google Finance e aviso de atraso. O widget externo foi carregado com sucesso como um iframe do TradingView, usando o símbolo `BMFBOVESPA:IBOV`, mudança em preço e porcentagem (`changeMode: price-and-percent`), gráfico de área e intervalos que incluem 1D e 5D. Dimensões medidas do card: 330px de largura e aproximadamente 236,5px de altura.

