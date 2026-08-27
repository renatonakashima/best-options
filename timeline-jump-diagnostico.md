## Diagnóstico do atalho de centralização

No teste local com operações temporárias em 18/09/2026 e 18/12/2026, os alvos eram encontrados corretamente, mas o `scrollLeft` permanecia em aproximadamente 65 px enquanto o item-alvo continuava milhares de pixels à direita. Os contêineres tinham `scrollWidth` de 34.450 px e `clientWidth` de 1.240 px, portanto o limite de rolagem não era o problema.

A causa é a combinação de `scrollTo({ behavior: "smooth" })` com o listener de sincronização: os eventos intermediários da animação acionam nova sincronização a partir da posição parcial e interrompem a animação antes de chegar ao destino. A correção será usar posicionamento imediato (`scrollLeft`) para os saltos e sincronizar as duas faixas no mesmo valor, evitando o ciclo de realimentação. As setas também serão sincronizadas pelo mesmo caminho para preservar o alinhamento.

## Validação após a correção

Com as duas operações temporárias, o atalho `first` posicionou 18/09/2026 com centro em 640 px e diferença de 0 px em relação ao centro do eixo. O atalho `last` posicionou 18/12/2026 também com centro em 640 px e diferença de 0 px. A rolagem das faixas ficou sincronizada em ambos os casos (`scrollLeft` 1880 px e 5910 px, respectivamente).

## Validação das setas incrementais

Com cinco datas consecutivas de teste, a seta direita avançou exatamente uma coluna de data (`rightAdvancedOneDate: true`) e a seta esquerda retornou à coluna anterior (`leftReturnedToPrevious: true`). As faixas do eixo e dos cards permaneceram alinhadas. Os dados de teste foram removidos do armazenamento local após a validação.

## Validação da rolagem suave

Durante o teste com cinco datas, a seta direita alterou progressivamente o `scrollLeft` de 2511 para 2610 px após 100 ms e chegou a 2810 px ao fim da animação. A data central mudou de 28/08/2026 para 04/09/2026, com diferença final de 0 px em relação ao centro do eixo. Os dados temporários foram usados somente no navegador local e serão removidos após o teste.

