# Best Options - Monitor de Operações com Opções

Um dashboard profissional e intuitivo para monitoramento de operações com opções, desenvolvido em HTML, CSS e JavaScript puro. Permite rastrear posições abertas, histórico de operações e análise detalhada de P&L e Greeks.

## 🚀 Funcionalidades

### 📊 Dashboard Principal
- **Estatísticas em Tempo Real**: Visualize o valor total da carteira e P&L consolidado
- **Posições Abertas**: Visualização em cards com todos os detalhes da operação
- **Histórico Completo**: Tabela com todas as operações fechadas e expiradas
- **Análise Avançada**: Estatísticas de desempenho, taxa de acerto e volatilidade média

### 📈 Gerenciamento de Operações
- **Adicionar Operações**: Registre novas operações com todos os parâmetros (Strike, IV, Delta, Theta)
- **Editar Posições**: Atualize preço atual, status e preço de saída
- **Calcular P&L**: Cálculo automático de ganho/perda para cada operação
- **Suporte a Múltiplos Tipos**: Call/Put compradas, Call/Put vendidas e Spreads

### 💾 Armazenamento Local
- Todos os dados são salvos automaticamente no navegador (localStorage)
- Nenhum servidor necessário - funciona 100% offline
- Exportar dados em JSON para backup

### 📱 Design Responsivo
- Interface moderna com tema escuro profissional
- Totalmente responsivo para desktop, tablet e mobile
- Animações suaves e transições elegantes

## 🎯 Como Usar

### 1. Acessar o Dashboard
Abra o arquivo `index.html` em seu navegador.

### 2. Adicionar uma Nova Operação
1. Clique no botão **"+ Nova Operação"**
2. Preencha os campos:
   - **Ativo**: Código do ativo (ex: PETR4, VALE3)
   - **Tipo de Operação**: Call/Put comprada ou vendida, Spread
   - **Strike**: Preço de exercício
   - **Quantidade**: Número de contratos
   - **Preço de Entrada**: Prêmio pago/recebido
   - **Data de Vencimento**: Quando o contrato expira
   - **IV (Volatilidade Implícita)**: Percentual de volatilidade
   - **Delta e Theta**: Gregos da opção
   - **Observações**: Notas sobre a operação
3. Clique em **"Adicionar Operação"**

### 3. Monitorar Posições
- As posições abertas aparecem em cards na aba **"Posições Abertas"**
- Cada card mostra:
  - Tipo de operação (Call/Put)
  - Preço de entrada e atual
  - Dias até vencimento
  - Gregos (Delta, Theta, IV)
  - P&L em tempo real

### 4. Editar Operações
1. Clique em **"✏️ Editar"** na posição
2. Atualize o preço atual e status
3. Se fechar a posição, informe o preço de saída
4. Clique em **"Salvar Alterações"**

### 5. Visualizar Histórico
- Acesse a aba **"Histórico"** para ver todas as operações fechadas
- Tabela completa com entrada, saída e P&L

### 6. Analisar Performance
- Aba **"Análise"** mostra:
  - Total de operações e taxa de acerto
  - P&L positivo e negativo
  - Maior ganho e maior perda
  - Volatilidade e Gregos médios

### 7. Exportar Dados
- Clique em **"📥 Exportar"** para baixar um arquivo JSON com todos os dados
- Útil para backup ou análise em outras ferramentas

## 📊 Cálculo de P&L

O sistema calcula automaticamente o P&L de cada operação:

- **Para Calls/Puts Compradas**: `(Preço Saída - Preço Entrada) × Quantidade`
- **Para Calls/Puts Vendidas**: `(Preço Entrada - Preço Saída) × Quantidade`

*Nota: A quantidade é exatamente a que você digitar (suporta contratos unitários)*

## 🎨 Tema e Customização

O dashboard usa um tema escuro profissional com cores:
- **Azul**: Elementos primários e ações
- **Verde**: Ganhos (P&L positivo)
- **Vermelho**: Perdas (P&L negativo)
- **Amarelo**: Avisos e spreads

Para customizar cores, edite as variáveis CSS em `styles.css`:

```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* ... */
}
```

## 💾 Dados e Privacidade

- Todos os dados são armazenados **localmente no seu navegador** (localStorage)
- Nenhum dado é enviado para servidores
- Para limpar dados, clique em **"🗑️ Limpar Dados"** (ação irreversível)

## 🔧 Requisitos

- Navegador moderno com suporte a:
  - HTML5
  - CSS3
  - JavaScript ES6+
  - localStorage

## 📝 Estrutura de Arquivos

```
best-options/
├── index.html      # Estrutura HTML do dashboard
├── styles.css      # Estilos e tema
├── script.js       # Lógica e funcionalidades
└── README.md       # Esta documentação
```

## 🚀 Deployment

Este projeto está configurado para rodar no **GitHub Pages**. Para acessar:

1. Acesse: `https://renatonakashima.github.io/best-options/`
2. O site estará disponível automaticamente

## 📋 Exemplo de Operação

```
Ativo: PETR4
Tipo: Call Comprada
Strike: R$ 25.00
Quantidade: 2 contratos
Preço Entrada: R$ 0.50
Data Vencimento: 2026-08-15
IV: 25%
Delta: 0.65
Theta: -0.05
```

**P&L Atual** (se preço atual = R$ 0.75):
- Valor Entrada: 0.50 × 2 = R$ 1.00
- Valor Atual: 0.75 × 2 = R$ 1.50
- **P&L: +R$ 0.50**

## 🐛 Troubleshooting

### Dados desapareceram
- Verifique se o localStorage não foi limpo (Ctrl+Shift+Delete)
- Tente restaurar do arquivo JSON exportado

### Operações não aparecem
- Recarregue a página (F5)
- Verifique se o navegador permite localStorage

### P&L incorreto
- Verifique se o preço de entrada e saída estão corretos
- Confirme a quantidade de contratos
- Lembre-se: 1 contrato = 100 ações

## 📞 Suporte

Para dúvidas ou sugestões, abra uma issue no repositório GitHub.

## 📄 Licença

Este projeto é de código aberto e pode ser usado livremente.

---

**Desenvolvido com ❤️ para traders de opções**
