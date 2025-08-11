Este documento explica como os aplicativos de servidor da Web usam as
bibliotecas de cliente das APIs do Google ou os endpoints OAuth 2.0 do Google
para implementar a autorização do OAuth 2.0 e acessar as APIs do Google.

O OAuth 2.0 permite que os usuários compartilhem dados específicos com um
aplicativo, mantendo a privacidade de nomes de usuário, senhas e outras
informações. Por exemplo, um aplicativo pode usar o OAuth 2.0 para receber
permissão dos usuários e armazenar arquivos nos respectivos Google Drives.

Esse fluxo do OAuth 2.0 é específico para autorização do usuário. Ele foi criado
para aplicativos que podem armazenar informações confidenciais e manter o
estado. Um aplicativo de servidor da Web autorizado pode acessar uma API
enquanto o usuário interage com o aplicativo ou depois que ele saiu do
aplicativo.

Os aplicativos de servidor da Web também usam
[contas de serviço](https://developers.google.com/identity/protocols/oauth2/service-account?hl=pt-br)
para autorizar solicitações de API, principalmente ao chamar APIs do Cloud para
acessar dados baseados em projetos em vez de dados específicos do usuário. Os
aplicativos de servidor da Web podem usar contas de serviço com autorização do
usuário.

## Bibliotecas de cliente

Os exemplos específicos de linguagem nesta página usam
[bibliotecas de cliente das APIs do Google](https://developers.google.com/api-client-library?hl=pt-br)
para implementar a autorização do OAuth 2.0. Para executar os exemplos de
código, primeiro instale a biblioteca de cliente para sua linguagem.

Quando você usa uma biblioteca de cliente das APIs do Google para processar o
fluxo OAuth 2.0 do aplicativo, a biblioteca realiza muitas ações que o
aplicativo precisaria processar por conta própria. Por exemplo, ele determina
quando o aplicativo pode usar ou atualizar tokens de acesso armazenados e quando
o aplicativo precisa adquirir o consentimento novamente. A biblioteca de cliente
também gera URLs de redirecionamento corretos e ajuda a implementar
manipuladores de redirecionamento que trocam códigos de autorização por tokens
de acesso.

As bibliotecas de cliente da API do Google para aplicativos do lado do servidor
estão disponíveis para as seguintes linguagens:

- [Go](https://github.com/googleapis/google-api-go-client)
- [Java](https://developers.google.com/api-client-library/java?hl=pt-br)
- [.NET](https://developers.google.com/api-client-library/dotnet?hl=pt-br)
- [Node.js](https://github.com/googleapis/google-api-nodejs-client)
- [Dart](https://dart.dev/googleapis/)
- [PHP](https://github.com/googleapis/google-api-php-client)
- [Python](https://github.com/googleapis/google-api-python-client)
- [Ruby](https://github.com/googleapis/google-api-ruby-client)

## Pré-requisitos

### Ativar as APIs do projeto

Qualquer aplicativo que chame as APIs do Google precisa ativar essas APIs no API
Console.

Para ativar uma API para um projeto, faça o seguinte:

1. [Open the API Library](https://console.developers.google.com/apis/library?hl=pt-br)
   no Google API Console.
2. If prompted, select a project, or create a new one.
3. A API Library lista todas as APIs disponíveis, agrupadas por família de
   produtos e popularidade. Se a API que você quer ativar não estiver visível na
   lista, use a pesquisa para encontrá-la ou clique em **Ver tudo** na família
   de produtos a que ela pertence.
4. Selecione aquela que você quer habilitar e clique no botão **Ativar**.
5. If prompted, enable billing.
6. If prompted, read and accept the API's Terms of Service.

### Criar credenciais de autorização

Qualquer aplicativo que use o OAuth 2.0 para acessar as APIs do Google precisa
ter credenciais de autorização que identifiquem o aplicativo para o servidor
OAuth 2.0 do Google. As etapas a seguir explicam como criar credenciais para seu
projeto. Seus aplicativos podem usar as credenciais para acessar as APIs que
você ativou para esse projeto.

1. Go to the
   [Credentials page](https://console.developers.google.com/apis/credentials?hl=pt-br).
2. Clique em **Criar cliente**.
3. Selecione o tipo de aplicativo **Aplicativo da Web**.
4. Preencha o formulário e clique em **Criar**. Os aplicativos que usam
   linguagens e frameworks como PHP, Java, Python, Ruby e .NET precisam
   especificar **URIs de redirecionamento** autorizados. Os URIs de
   redirecionamento são os endpoints para os quais o servidor OAuth 2.0 pode
   enviar respostas. Esses endpoints precisam obedecer às
   [regras de validação do Google](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#uri-validation).

   Para testes, é possível especificar URIs que se referem à máquina local, como
   `http://localhost:8080`. Por isso, todos os exemplos neste documento usam
   `http://localhost:8080` como o URI de redirecionamento.

   Recomendamos que você
   [projete os endpoints de autenticação do app](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#protectauthcode)
   para que o aplicativo não exponha códigos de autorização a outros recursos na
   página.

Depois de criar as credenciais, faça o download do arquivo
**client\_secret.json** do API Console. Armazene o arquivo com segurança em um
local que só o aplicativo possa acessar.

### Identificar escopos de acesso

Os escopos permitem que seu aplicativo solicite acesso apenas aos recursos
necessários, além de permitir que os usuários controlem o nível de acesso que
concedem ao seu aplicativo. Assim, pode haver uma relação inversa entre o número
de escopos solicitados e a probabilidade de obter o consentimento do usuário.

Antes de começar a implementar a autorização do OAuth 2.0, recomendamos que você
identifique os escopos que seu app precisará de permissão para acessar.

Também recomendamos que seu aplicativo solicite acesso a escopos de autorização
por um processo de
[autorização incremental](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#incrementalAuth),
em que o aplicativo pede acesso aos dados do usuário de acordo com o contexto.
Essa prática recomendada ajuda os usuários a entenderem com mais facilidade por
que o aplicativo precisa do acesso que está solicitando.

O documento
[Escopos da API OAuth 2.0](https://developers.google.com/identity/protocols/oauth2/scopes?hl=pt-br)
contém uma lista completa de escopos que você pode usar para acessar as APIs do
Google.

### Requisitos específicos de idioma

Para executar qualquer um dos exemplos de código neste documento, você precisa
de uma Conta do Google, acesso à Internet e um navegador da Web. Se você estiver
usando uma das bibliotecas de cliente da API, consulte também os requisitos
específicos da linguagem abaixo.

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

Para executar os exemplos de código em PHP neste documento, você vai precisar do
seguinte:

- PHP 8.0 ou mais recente com a interface de linha de comando (CLI) e a extensão
  JSON instaladas.
- A ferramenta de gerenciamento de dependências
  [Composer](https://getcomposer.org/).
- A biblioteca de cliente das APIs do Google para PHP:

  ```
  composer require google/apiclient:^2.15.0
  ```

Consulte
[Biblioteca de cliente das APIs do Google para PHP](https://github.com/googleapis/google-api-php-client)
para mais informações.

## Como conseguir tokens de acesso do OAuth 2.0

As etapas a seguir mostram como seu aplicativo interage com o servidor OAuth 2.0
do Google para obter o consentimento de um usuário para fazer uma solicitação de
API em nome dele. Seu aplicativo precisa ter esse consentimento antes de
executar uma solicitação de API do Google que exija autorização do usuário.

A lista abaixo resume rapidamente essas etapas:

1. Seu aplicativo identifica as permissões necessárias.
2. Seu aplicativo redireciona o usuário para o Google com a lista de permissões
   solicitadas.
3. O usuário decide se concede as permissões ao seu aplicativo.
4. O aplicativo descobre o que o usuário decidiu.
5. Se o usuário conceder as permissões solicitadas, o aplicativo vai recuperar
   os tokens necessários para fazer solicitações de API em nome do usuário.

### Etapa 1: definir parâmetros de autorização

A primeira etapa é criar a solicitação de autorização. Essa solicitação define
parâmetros que identificam seu aplicativo e definem as permissões que o usuário
precisará conceder a ele.

- Se você usar uma biblioteca de cliente do Google para autenticação e
  autorização do OAuth 2.0, crie e configure um objeto que defina esses
  parâmetros.
- Se você chamar o endpoint do Google OAuth 2.0 diretamente, vai gerar um URL e
  definir os parâmetros nele.

As guias abaixo definem os parâmetros de autorização compatíveis com aplicativos
de servidor da Web. Os exemplos específicos de linguagem também mostram como
usar uma biblioteca de cliente ou de autorização para configurar um objeto que
define esses parâmetros.

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

O snippet de código a seguir cria um objeto `Google\Client()`, que define os
parâmetros na solicitação de autorização.

Esse objeto usa informações do arquivo **client\_secret.json** para identificar
seu aplicativo. Consulte
[Como criar credenciais de autorização](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#creatingcred)
para saber mais sobre esse arquivo. O objeto também identifica os escopos para
os quais seu aplicativo está solicitando permissão de acesso e o URL do endpoint
de autenticação do aplicativo, que vai processar a resposta do servidor OAuth
2.0 do Google. Por fim, o código define os parâmetros opcionais `access_type` e
`include_granted_scopes`.

Por exemplo, este código solicita acesso somente leitura e off-line aos
metadados do Google Drive e aos eventos da agenda de um usuário:

```
<span>use Google\Client;</span>

<span>$client = new Client();</span>

<span>// Required, call the setAuthConfig function to load authorization credentials from</span>
<span>// client_secret.json file.</span>
<span>$client-&gt;setAuthConfig('client_secret.json');</span>

<span>// Required, to set the scope value, call the addScope function</span>
<span>$client-&gt;addScope([Google\Service\Drive::DRIVE_METADATA_READONLY, Google\Service\Calendar::CALENDAR_READONLY]);</span>

<span>// Required, call the setRedirectUri function to specify a valid redirect URI for the</span>
<span>// provided client_id</span>
<span>$client-&gt;setRedirectUri('http://' . $_SERVER['HTTP_HOST'] . '/oauth2callback.php');</span>

<span>// Recommended, offline access will give you both an access and refresh token so that</span>
<span>// your app can refresh the access token without user interaction.</span>
<span>$client-&gt;setAccessType('offline');</span>

<span>// Recommended, call the setState function. Using a state value can increase your assurance that</span>
<span>// an incoming connection is the result of an authentication request.</span>
<span>$client-&gt;setState($sample_passthrough_value);</span>

<span>// Optional, if your application knows which user is trying to authenticate, it can use this</span>
<span>// parameter to provide a hint to the Google Authentication Server.</span>
<span>$client-&gt;setLoginHint('hint@example.com');</span>

<span>// Optional, call the setPrompt function to set "consent" will prompt the user for consent</span>
<span>$client-&gt;setPrompt('consent');</span>

<span>// Optional, call the setIncludeGrantedScopes function with true to enable incremental</span>
<span>// authorization</span>
<span>$client-&gt;setIncludeGrantedScopes(true);</span>
```

O servidor de autorização do Google é compatível com os seguintes parâmetros de
string de consulta para aplicativos de servidor da Web:

| Parâmetros                                              |
| ------------------------------------------------------- |
| `client_id`                                             |
| O ID do cliente do seu aplicativo. Esse valor está no . |

| | `redirect_uri` | **Obrigatório**

Determina para onde o servidor da API redireciona o usuário depois que ele
conclui o fluxo de autorização. O valor precisa corresponder exatamente a um dos
URIs de redirecionamento autorizados para o cliente OAuth 2.0, que você
configurou no do cliente. Se esse valor não corresponder a um URI de
redirecionamento autorizado para o `client_id` fornecido, você vai receber um
erro `redirect_uri_mismatch`.

O esquema `http` ou `https`, o uso de maiúsculas e minúsculas e a barra
invertida final ("`/`") precisam ser iguais.

| | `response_type` | **Obrigatório**

Determina se o endpoint do Google OAuth 2.0 retorna um código de autorização.

Defina o valor do parâmetro como `code` para aplicativos de servidor da Web.

| | `scope` | **Obrigatório**

Uma lista delimitada por espaços de escopos que identificam os recursos que seu
aplicativo pode acessar em nome do usuário. Esses valores informam à tela de
consentimento que o Google mostra ao usuário.

Os escopos permitem que seu aplicativo solicite acesso apenas aos recursos
necessários, além de permitir que os usuários controlem o nível de acesso que
concedem ao seu aplicativo. Assim, há uma relação inversa entre o número de
escopos solicitados e a probabilidade de obter o consentimento do usuário.

Recomendamos que seu aplicativo solicite acesso a escopos de autorização no
contexto sempre que possível. Ao solicitar acesso a dados do usuário de acordo
com o contexto, via
[autorização incremental](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#incrementalAuth),
você ajuda os usuários a entender mais facilmente por que seu aplicativo precisa
do acesso que está solicitando.

| | `access_type` | **Recomendado**

Indica se o aplicativo pode atualizar tokens de acesso quando o usuário não está
presente no navegador. Os valores de parâmetro válidos são `online`, que é o
valor padrão, e `offline`.

Defina o valor como `offline` se o aplicativo precisar atualizar os tokens de
acesso quando o usuário não estiver presente no navegador. Esse é o método de
atualização de tokens de acesso descrito mais adiante neste documento. Esse
valor instrui o servidor de autorização do Google a retornar um token de
atualização _e_ um token de acesso na primeira vez que seu aplicativo troca um
código de autorização por tokens.

| | `state` | **Recomendado**

Especifica qualquer valor de string que o aplicativo usa para manter o estado
entre a solicitação de autorização e a resposta do servidor de autorização. O
servidor retorna o valor exato que você envia como um par `name=value` no
componente de consulta de URL (`?`) do `redirect_uri` depois que o usuário
aceita ou nega a solicitação de acesso do aplicativo.

É possível usar esse parâmetro para várias finalidades, como direcionar o
usuário ao recurso correto no aplicativo, enviar nonces e reduzir a falsificação
de solicitações entre sites. Como seu `redirect_uri` pode ser adivinhado, usar
um valor `state` aumenta a garantia de que uma conexão recebida é resultado de
uma solicitação de autenticação. Se você gerar uma string aleatória ou codificar
o hash de um cookie ou outro valor que capture o estado do cliente, poderá
validar a resposta para garantir ainda mais que a solicitação e a resposta se
originaram no mesmo navegador, oferecendo proteção contra ataques como
[falsificação de solicitação entre sites](https://datatracker.ietf.org/doc/html/rfc6749#section-10.12).
Consulte a documentação do
[OpenID Connect](https://developers.google.com/identity/protocols/oauth2/openid-connect?hl=pt-br#createxsrftoken)
para ver um exemplo de como criar e confirmar um token `state`.

| | `include_granted_scopes` | **Opcional**

Permite que os aplicativos usem a autorização incremental para solicitar acesso
a outros escopos no contexto. Se você definir o valor desse parâmetro como
`true` e o pedido de autorização for concedido, o novo token de acesso também
vai abranger todos os escopos a que o usuário concedeu acesso ao aplicativo
anteriormente. Consulte a seção
[autorização incremental](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#incrementalAuth)
para ver exemplos.

| | `enable_granular_consent` | **Opcional**

O valor padrão é `true`. Se definido como `false`,
[permissões mais granulares da Conta do Google](https://developers.google.com/identity/protocols/oauth2/resources/granular-permissions?hl=pt-br)
serão desativadas para IDs de cliente OAuth criados antes de 2019. Não tem
efeito para IDs de clientes OAuth mais recentes, já que as permissões mais
granulares estão sempre ativadas para eles.

Quando o Google ativar as permissões granulares para um aplicativo, esse
parâmetro não terá mais efeito.

| | `login_hint` | **Opcional**

Se o aplicativo souber qual usuário está tentando se autenticar, ele poderá usar
esse parâmetro para fornecer uma dica ao servidor de autenticação do Google. O
servidor usa a dica para simplificar o fluxo de login, preenchendo o campo de
e-mail no formulário de login ou selecionando a sessão de vários logins
apropriada.

Defina o valor do parâmetro como um endereço de e-mail ou um identificador
`sub`, que é equivalente ao ID do Google do usuário.

| | `prompt` | **Opcional**

Uma lista de comandos delimitada por espaço e sensível a maiúsculas e minúsculas
para apresentar ao usuário. Se você não especificar esse parâmetro, o usuário
vai receber a solicitação apenas na primeira vez que seu projeto pedir acesso.
Consulte
[Solicitar novo consentimento](https://developers.google.com/identity/protocols/oauth2/openid-connect?hl=pt-br#re-consent)
para mais informações.

Os valores possíveis são:

<table><tbody><tr><td><code dir="ltr" translate="no">none</code></td><td>Não mostre telas de autenticação ou consentimento. Não pode ser especificado com outros valores.</td></tr><tr><td><code dir="ltr" translate="no">consent</code></td><td>Peça o consentimento do usuário.</td></tr><tr><td><code dir="ltr" translate="no">select_<wbr>account</code></td><td>Solicite que o usuário selecione uma conta.</td></tr></tbody></table>

|

### Etapa 2: redirecionar para o servidor OAuth 2.0 do Google

Redirecione o usuário para o servidor OAuth 2.0 do Google para iniciar o
processo de autenticação e autorização. Isso geralmente acontece quando o
aplicativo precisa acessar os dados do usuário pela primeira vez. No caso da
[autorização incremental](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#incrementalAuth),
essa etapa também ocorre quando o aplicativo precisa acessar recursos adicionais
que ainda não têm permissão de acesso.

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

1. Gere um URL para solicitar acesso do servidor OAuth 2.0 do Google:

   ```
   <span>$auth_url = $client-&gt;createAuthUrl();</span>
   ```

2. Redirecione o usuário para `$auth_url`:

   ```
   <span>header('Location: ' . filter_var($auth_url, FILTER_SANITIZE_URL));</span>
   ```

O servidor OAuth 2.0 do Google autentica o usuário e recebe o consentimento dele
para que seu aplicativo acesse os escopos solicitados. A resposta é enviada de
volta ao aplicativo usando o URL de redirecionamento especificado.

### Etapa 3: o Google pede o consentimento do usuário

Nesta etapa, o usuário decide se concede ao aplicativo o acesso solicitado.
Nessa etapa, o Google exibe uma janela de consentimento que mostra o nome do seu
aplicativo e os serviços da API do Google que ele está solicitando permissão
para acessar com as credenciais de autorização do usuário e um resumo dos
escopos de acesso a serem concedidos. O usuário pode consentir em conceder
acesso a um ou mais escopos solicitados pelo aplicativo ou recusar a
solicitação.

Nesta etapa, o aplicativo não precisa fazer nada, já que aguarda a resposta do
servidor OAuth 2.0 do Google indicando se algum acesso foi concedido. Essa
resposta é explicada na próxima etapa.

As solicitações ao endpoint de autorização do OAuth 2.0 do Google podem mostrar
mensagens de erro para o usuário em vez dos fluxos de autenticação e autorização
esperados. Confira abaixo os códigos de erro comuns e as resoluções sugeridas.

##### `admin_policy_enforced`

A Conta do Google não pode autorizar um ou mais escopos solicitados devido às
políticas do administrador do Google Workspace. Consulte o artigo de ajuda do
administrador do Google Workspace
[Controlar quais apps internos e de terceiros acessam os dados do Google Workspace](https://support.google.com/a/answer/7281227?hl=pt-br)
para mais informações sobre como um administrador pode restringir o acesso a
todos os escopos ou a escopos sensíveis e restritos até que o acesso seja
concedido explicitamente ao ID do cliente OAuth.

##### `disallowed_useragent`

O endpoint de autorização é mostrado em um user agent incorporado proibido pelas
[políticas do OAuth 2.0](https://developers.google.com/identity/protocols/oauth2/policies?hl=pt-br#browsers)
do Google.

[Android](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#android)
[iOS](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ios)

Os desenvolvedores Android podem encontrar essa mensagem de erro ao abrir
solicitações de autorização em
[`android.webkit.WebView`](https://developer.android.com/reference/android/webkit/WebView?hl=pt-br).
Em vez disso, os desenvolvedores precisam usar bibliotecas do Android, como o
[Google Sign-In para Android](https://developers.google.com/identity/sign-in/android?hl=pt-br)
ou o [AppAuth para Android](https://openid.github.io/AppAuth-Android/) da OpenID
Foundation.

Os desenvolvedores da Web podem encontrar esse erro quando um app Android abre
um link da Web geral em um user agent incorporado e um usuário navega até o
endpoint de autorização do OAuth 2.0 do Google no seu site. Os desenvolvedores
precisam permitir que links gerais sejam abertos no gerenciador de links padrão
do sistema operacional, que inclui gerenciadores de
[links de apps Android](https://developer.android.com/training/app-links?hl=pt-br)
ou o app de navegador padrão. A biblioteca
[Android Custom Tabs](https://developer.chrome.com/docs/android/custom-tabs/overview/?hl=pt-br)
também é uma opção compatível.

##### `org_internal`

O ID do cliente OAuth na solicitação faz parte de um projeto que limita o acesso
a Contas do Google em uma
[organização do Google Cloud](https://cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy?hl=pt-br#organizations)
específica. Para mais informações sobre essa opção de configuração, consulte a
seção
[Tipo de usuário](https://support.google.com/cloud/answer/10311615?hl=pt-br#user-type)
no artigo de ajuda "Como configurar a tela de permissão OAuth".

##### `invalid_client`

A chave secreta do cliente OAuth está incorreta. Revise a
[configuração do cliente OAuth](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow?hl=pt-br#creatingcred),
incluindo o ID e a chave secreta do cliente usados para esta solicitação.

##### `deleted_client`

O cliente OAuth usado para fazer a solicitação foi excluído. A exclusão pode
acontecer manualmente ou automaticamente no caso de
[clientes não utilizados](https://support.google.com/cloud/answer/15549257?hl=pt-br#unused-client-deletion)
. Os clientes excluídos podem ser restaurados em até 30 dias após a exclusão.
[Saiba mais](https://support.google.com/cloud/answer/15549257?hl=pt-br#delete-oauth-clients)
.

##### `invalid_grant`

[Ao atualizar um token de acesso](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#offline)
ou usar a
[autorização incremental](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#incrementalAuth),
o token pode ter expirado ou sido invalidado. Autentique o usuário novamente e
peça o consentimento dele para receber novos tokens. Se o erro persistir,
verifique se o aplicativo foi configurado corretamente e se você está usando os
tokens e parâmetros certos na sua solicitação. Caso contrário, a conta de
usuário pode ter sido excluída ou desativada.

##### `redirect_uri_mismatch`

O `redirect_uri` transmitido na solicitação de autorização não corresponde a um
URI de redirecionamento autorizado para o ID do cliente OAuth. Revise os URIs de
redirecionamento autorizados em .

O parâmetro `redirect_uri` pode se referir ao fluxo fora de banda (OOB) do
OAuth, que foi descontinuado e não tem mais suporte. Consulte o
[guia de migração](https://developers.google.com/identity/protocols/oauth2/resources/oob-migration?hl=pt-br)
para atualizar sua integração.

##### `invalid_request`

Algo deu errado com a solicitação. Isso pode acontecer por vários motivos:

- A solicitação não estava formatada corretamente
- A solicitação não tinha os parâmetros obrigatórios
- A solicitação usa um método de autorização não compatível com o Google.
  Verifique se a integração do OAuth usa um método recomendado.

### Etapa 4: processar a resposta do servidor OAuth 2.0

O servidor OAuth 2.0 responde à solicitação de acesso do seu aplicativo usando o
URL especificado na solicitação.

Se o usuário aprovar a solicitação de acesso, a resposta vai conter um código de
autorização. Se o usuário não aprovar a solicitação, a resposta vai conter uma
mensagem de erro. O código de autorização ou a mensagem de erro retornada ao
servidor da Web aparece na string de consulta, conforme mostrado abaixo:

Uma resposta de erro:

```
https://oauth2.example.com/auth?error=access_denied
```

Uma resposta de código de autorização:

```
https://oauth2.example.com/auth?code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7
```

#### Exemplo de resposta do servidor OAuth 2.0

Para testar esse fluxo, clique no seguinte URL de amostra, que solicita acesso
somente leitura para ver metadados de arquivos no Google Drive e acesso somente
leitura para ver seus eventos da Agenda Google:

```
<a href="https://accounts.google.com/o/oauth2/v2/auth?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.metadata.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly&amp;%3Bstate=state_parameter_passthrough_value&amp;%3Bredirect_uri=https%3A%2F%2Foauth2.example.com%2Fcode&amp;%3Baccess_type=offline&amp;%3Bresponse_type=code&amp;%3Bclient_id=583306224539-atbcaa8ne8g85e8kc006o6vmq99qiid0.apps.googleusercontent.com&amp;hl=pt-br">https://accounts.google.com/o/oauth2/v2/auth?
 scope=https%3A//www.googleapis.com/auth/drive.metadata.readonly%20https%3A//www.googleapis.com/auth/calendar.readonly&amp;
 access_type=offline&amp;
 include_granted_scopes=true&amp;
 response_type=code&amp;
 state=<devsite-var rendered="" translate="no" is-upgraded="" scope="state_parameter_passthrough_value"><span><var spellcheck="false" is-upgraded="">state_parameter_passthrough_value</var></span></devsite-var>&amp;
 redirect_uri=<devsite-var rendered="" translate="no" is-upgraded="" scope="https%3A//oauth2.example.com/code"><span><var spellcheck="false" is-upgraded="">https%3A//oauth2.example.com/code</var></span></devsite-var>&amp;
 client_id=<devsite-var rendered="" translate="no" is-upgraded="" scope="client_id"><span><var spellcheck="false" is-upgraded="">client_id</var></span></devsite-var></a>
```

Depois de concluir o fluxo do OAuth 2.0, você será redirecionado para
`http://localhost/oauth2callback`, que provavelmente vai gerar um erro
`404 NOT FOUND`, a menos que sua máquina local disponibilize um arquivo nesse
endereço. A próxima etapa fornece mais detalhes sobre as informações retornadas
no URI quando o usuário é redirecionado de volta ao aplicativo.

### Etapa 5: trocar o código de autorização por tokens de atualização e de acesso

Depois que o servidor da Web recebe o código de autorização, ele pode trocá-lo
por um token de acesso.

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

Para trocar um código de autorização por um token de acesso, use o método
`fetchAccessTokenWithAuthCode`:

```
<span>$access_token = $client-&gt;fetchAccessTokenWithAuthCode($_GET['code']);</span>
```

#### Erros

Ao trocar o código de autorização por um token de acesso, você pode encontrar o
seguinte erro em vez da resposta esperada. Confira abaixo os códigos de erro
comuns e as resoluções sugeridas.

##### `invalid_grant`

O código de autorização fornecido é inválido ou está no formato errado. Peça um
novo código
[reiniciando o processo OAuth](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#creatingclient)
para solicitar o consentimento do usuário novamente.

### Etapa 6: verificar quais escopos os usuários concederam

Ao solicitar **várias** permissões (escopos), os usuários podem não conceder ao
app acesso a todas elas. Seu app precisa verificar quais escopos foram
concedidos e processar corretamente situações em que algumas permissões são
negadas, geralmente desativando os recursos que dependem desses escopos negados.

No entanto, há exceções. Os apps do Google Workspace Enterprise com
[delegação de autoridade em todo o domínio](https://support.google.com/a/answer/162106?hl=pt-br)
ou marcados como
[Confiáveis](https://support.google.com/a/answer/7281227?hl=pt-br#zippy=,change-access-from-the-app-list)
ignoram a tela de permissão de acesso granular. Para esses apps, os usuários não
vão ver a tela de permissão granular. Em vez disso, seu app vai receber todos os
escopos solicitados ou nenhum.

Para mais informações, consulte
[Como processar permissões granulares](https://developers.google.com/identity/protocols/oauth2/resources/granular-permissions?hl=pt-br).

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

Para verificar quais escopos o usuário concedeu, use o método
`getGrantedScope()`:

```
<span>// Space-separated string of granted scopes if it exists, otherwise null.</span>
<span>$granted_scopes = $client-&gt;getOAuth2Service()-&gt;getGrantedScope();</span>

<span>// Determine which scopes user granted and build a dictionary</span>
<span>$granted_scopes_dict = [</span>
<span>  'Drive' =&gt; str_contains($granted_scopes, Google\Service\Drive::DRIVE_METADATA_READONLY),</span>
<span>  'Calendar' =&gt; str_contains($granted_scopes, Google\Service\Calendar::CALENDAR_READONLY)</span>
<span>];</span>
```

## Chamar APIs do Google

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

Use o token de acesso para chamar as APIs do Google seguindo estas etapas:

1. Se você precisar aplicar um token de acesso a um novo objeto `Google\Client`,
   por exemplo, se você armazenou o token de acesso em uma sessão de usuário,
   use o método `setAccessToken`:

   ```
   <span>$client-&gt;setAccessToken($access_token);</span>
   ```

2. Crie um objeto de serviço para a API que você quer chamar. Para criar um
   objeto de serviço, forneça um objeto `Google\Client` autorizado ao construtor
   da API que você quer chamar. Por exemplo, para chamar a API Drive:

   ```
   <span>$drive = new Google\Service\Drive($client);</span>
   ```

3. Faça solicitações ao serviço de API usando a
   [interface fornecida pelo objeto de serviço](https://github.com/googleapis/google-api-php-client/blob/master/docs/start.md).
   Por exemplo, para listar os arquivos no Google Drive do usuário autenticado:

   ```
   <span>$files = $drive-&gt;files-&gt;listFiles(array());</span>
   ```

## Exemplo completo

O exemplo a seguir imprime uma lista de arquivos formatada em JSON no Google
Drive de um usuário depois que ele se autentica e dá consentimento para o
aplicativo acessar os metadados do Drive.

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

Para executar esse exemplo:

1. No API Console, adicione o URL da máquina local à lista de URLs de
   redirecionamento. Por exemplo, adicione `http://localhost:8080`.
2. Crie um novo diretório e mude para ele. Exemplo:

   ```
   mkdir ~/php-oauth2-example
   cd ~/php-oauth2-example
   ```

3. Instale a
   [biblioteca de cliente de APIs do Google para PHP](https://github.com/googleapis/google-api-php-client)
   usando o [Composer](https://getcomposer.org/):

   ```
   composer require google/apiclient:^2.15.0
   ```

4. Crie os arquivos `index.php` e `oauth2callback.php` com o seguinte conteúdo.
5. Execute o exemplo com o servidor da Web de teste integrado do PHP:

   ```
   php -S localhost:8080 ~/php-oauth2-example
   ```

#### index.php

```
&lt;<span>?php</span>
<span>require_once __DIR__.'/vendor/autoload.php';</span>

<span>session_start();</span>

<span>$client = new Google\Client();</span>
<span>$client-&gt;setAuthConfig('client_secret.json');</span>

<span>// User granted permission as an access token is in the session.</span>
<span>if (isset($_SESSION['access_token']) &amp;&amp; $_SESSION['access_token'])</span>
<span>{</span>
<span>  $client-&gt;setAccessToken($_SESSION['access_token']);</span>
<span>  </span>
<span>  // Check if user granted Drive permission</span>
<span>  if ($_SESSION['granted_scopes_dict']['Drive']) {</span>
<span>    echo "Drive feature is enabled.";</span>
<span>    echo "&lt;/br&gt;";</span>
<span>    $drive = new Drive($client);</span>
<span>    $files = array();</span>
<span>    $response = $drive-&gt;files-&gt;listFiles(array());</span>
<span>    foreach ($response-&gt;files as $file) {</span>
<span>        echo "File: " . $file-&gt;name . " (" . $file-&gt;id . ")";</span>
<span>        echo "&lt;/br&gt;";</span>
<span>    }</span>
<span>  } else {</span>
<span>    echo "Drive feature is NOT enabled.";</span>
<span>    echo "&lt;/br&gt;";</span>
<span>  }</span>

<span>   // Check if user granted Calendar permission</span>
<span>  if ($_SESSION['granted_scopes_dict']['Calendar']) {</span>
<span>    echo "Calendar feature is enabled.";</span>
<span>    echo "&lt;/br&gt;";</span>
<span>  } else {</span>
<span>    echo "Calendar feature is NOT enabled.";</span>
<span>    echo "&lt;/br&gt;";</span>
<span>  }</span>
<span>}</span>
<span>else</span>
<span>{</span>
<span>  // Redirect users to outh2call.php which redirects users to Google OAuth 2.0</span>
<span>  $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . '/oauth2callback.php';</span>
<span>  header('Location: ' . filter_var($redirect_uri, FILTER_SANITIZE_URL));</span>
<span>}</span>
<span>?</span>&gt;
```

#### oauth2callback.php

```
&lt;<span>?php</span>
<span>require_once __DIR__.'/vendor/autoload.php';</span>

<span>session_start();</span>

<span>$client = new Google\Client();</span>

<span>// Required, call the setAuthConfig function to load authorization credentials from</span>
<span>// client_secret.json file.</span>
<span>$client-&gt;setAuthConfigFile('client_secret.json');</span>
<span>$client-&gt;setRedirectUri('http://' . $_SERVER['HTTP_HOST']. $_SERVER['PHP_SELF']);</span>

<span>// Required, to set the scope value, call the addScope function.</span>
<span>$client-&gt;addScope([Google\Service\Drive::DRIVE_METADATA_READONLY, Google\Service\Calendar::CALENDAR_READONLY]);</span>

<span>// Enable incremental authorization. Recommended as a best practice.</span>
<span>$client-&gt;setIncludeGrantedScopes(true);</span>

<span>// Recommended, offline access will give you both an access and refresh token so that</span>
<span>// your app can refresh the access token without user interaction.</span>
<span>$client-&gt;setAccessType("offline");</span>

<span>// Generate a URL for authorization as it doesn't contain code and error</span>
<span>if (!isset($_GET['code']) &amp;&amp; !isset($_GET['error']))</span>
<span>{</span>
<span>  // Generate and set state value</span>
<span>  $state = bin2hex(random_bytes(16));</span>
<span>  $client-&gt;setState($state);</span>
<span>  $_SESSION['state'] = $state;</span>

<span>  // Generate a url that asks permissions.</span>
<span>  $auth_url = $client-&gt;createAuthUrl();</span>
<span>  header('Location: ' . filter_var($auth_url, FILTER_SANITIZE_URL));</span>
<span>}</span>

<span>// User authorized the request and authorization code is returned to exchange access and</span>
<span>// refresh tokens.</span>
<span>if (isset($_GET['code']))</span>
<span>{</span>
<span>  // Check the state value</span>
<span>  if (!isset($_GET['state']) || $_GET['state'] !== $_SESSION['state']) {</span>
<span>    die('State mismatch. Possible CSRF attack.');</span>
<span>  }</span>

<span>  // Get access and refresh tokens (if access_type is offline)</span>
<span>  $token = $client-&gt;fetchAccessTokenWithAuthCode($_GET['code']);</span>

<span>  /** Save access and refresh token to the session variables.</span>
<span>    * ACTION ITEM: In a production app, you likely want to save the</span>
<span>    *              refresh token in a secure persistent storage instead. */</span>
<span>  $_SESSION['access_token'] = $token;</span>
<span>  $_SESSION['refresh_token'] = $client-&gt;getRefreshToken();</span>
<span>  </span>
<span>  // Space-separated string of granted scopes if it exists, otherwise null.</span>
<span>  $granted_scopes = $client-&gt;getOAuth2Service()-&gt;getGrantedScope();</span>

<span>  // Determine which scopes user granted and build a dictionary</span>
<span>  $granted_scopes_dict = [</span>
<span>    'Drive' =&gt; str_contains($granted_scopes, Google\Service\Drive::DRIVE_METADATA_READONLY),</span>
<span>    'Calendar' =&gt; str_contains($granted_scopes, Google\Service\Calendar::CALENDAR_READONLY)</span>
<span>  ];</span>
<span>  $_SESSION['granted_scopes_dict'] = $granted_scopes_dict;</span>
<span>  </span>
<span>  $redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . '/';</span>
<span>  header('Location: ' . filter_var($redirect_uri, FILTER_SANITIZE_URL));</span>
<span>}</span>

<span>// An error response e.g. error=access_denied</span>
<span>if (isset($_GET['error']))</span>
<span>{</span>
<span>  echo "Error: ". $_GET['error'];</span>
<span>}</span>
<span>?</span>&gt;
```

## Regras de validação de URI de redirecionamento

O Google aplica as seguintes regras de validação a URIs de redirecionamento para
ajudar os desenvolvedores a manter os aplicativos seguros. Seus URIs de
redirecionamento precisam obedecer a estas regras. Consulte a
[seção 3 da RFC 3986](https://tools.ietf.org/html/rfc3986#section-3) para a
definição de domínio, host, caminho, consulta, esquema e userinfo, mencionados
abaixo.

| Regras de validação                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Esquema](https://tools.ietf.org/html/rfc3986#section-3.1)                                                                                                                  |
| Os URIs de redirecionamento precisam usar o esquema HTTPS, não HTTP simples. Os URIs de host local (incluindo URIs de endereço IP de host local) estão isentos dessa regra. |

| | [Host](https://tools.ietf.org/html/rfc3986#section-3.2.2) |

Os hosts não podem ser endereços IP brutos. Os endereços IP de localhost são
isentos dessa regra.

| | [Domínio](https://tools.ietf.org/html/rfc1034) | - Os TLDs de host
([domínios de nível superior](https://tools.ietf.org/id/draft-liman-tld-names-00.html))
precisam pertencer à
[lista de sufixos públicos](https://publicsuffix.org/list/).

- Os domínios de host não podem ser `“googleusercontent.com”`.
- Os URIs de redirecionamento não podem conter domínios de encurtadores de URL
  (por exemplo, `goo.gl`), a menos que o app seja proprietário do domínio. Além
  disso, se um app que tem um domínio de encurtador escolher redirecionar para
  esse domínio, o URI de redirecionamento precisará conter `“/google-callback/”`
  no caminho ou terminar com `“/google-callback”`. | |
  [Userinfo](https://tools.ietf.org/html/rfc3986#section-3.2.1) |

Os URIs de redirecionamento não podem conter o subcomponente userinfo.

| | [Caminho](https://tools.ietf.org/html/rfc3986#section-3.3) |

Os URIs de redirecionamento não podem conter uma travessia de caminho (também
chamada de retorno ao diretório), que é representada por um `“/..”` ou `“\..”`
ou a codificação de URL deles.

| | [Consulta](https://tools.ietf.org/html/rfc3986#section-3.4) |

Os URIs de redirecionamento não podem conter
[redirecionamentos abertos](https://tools.ietf.org/html/rfc6749#section-10.15).

| | [Fragmentos](https://tools.ietf.org/html/rfc3986#section-3.5) |

Os URIs de redirecionamento não podem conter o componente de fragmento.

| | Caracteres | Os URIs de redirecionamento não podem conter determinados
caracteres, incluindo:

- Caracteres curinga (`'*'`)
- Caracteres ASCII não imprimíveis
- Codificações de porcentagem inválidas (qualquer codificação de porcentagem que
  não siga a forma de codificação de URL de um sinal de porcentagem seguido por
  dois dígitos hexadecimais)
- Caracteres nulos (um caractere NULL codificado, por exemplo, `%00`, `%C0%80`)

|

## Autorização incremental

No protocolo OAuth 2.0, seu app solicita autorização para acessar recursos, que
são identificados por escopos. É considerada uma prática recomendada de
experiência do usuário solicitar autorização para recursos no momento em que
você precisa deles. Para ativar essa prática, o servidor de autorização do
Google oferece suporte à autorização incremental. Com esse recurso, é possível
solicitar escopos conforme necessário e, se o usuário conceder permissão para o
novo escopo, retornar um código de autorização que pode ser trocado por um token
que contém todos os escopos que o usuário concedeu ao projeto.

Por exemplo, um app que permite que as pessoas ouçam trechos de músicas e criem
mixes pode precisar de poucos recursos no momento do login, talvez apenas o nome
da pessoa que está fazendo login. No entanto, para salvar uma mixagem concluída,
é necessário ter acesso ao Google Drive. A maioria das pessoas acharia natural
se só fosse solicitado acesso ao Google Drive no momento em que o app realmente
precisasse dele.

Nesse caso, no momento do login, o app pode solicitar os escopos `openid` e
`profile` para realizar o login básico e, depois, solicitar o escopo
`https://www.googleapis.com/auth/drive.file` no momento da primeira solicitação
para salvar uma mix.

Para implementar a autorização incremental, conclua o fluxo normal de
solicitação de um token de acesso, mas verifique se a solicitação de autorização
inclui escopos concedidos anteriormente. Essa abordagem permite que o app evite
gerenciar vários tokens de acesso.

As regras a seguir se aplicam a um token de acesso obtido de uma autorização
incremental:

- O token pode ser usado para acessar recursos correspondentes a qualquer um dos
  escopos incluídos na nova autorização combinada.
- Quando você usa o token de atualização para a autorização combinada e recebe
  um token de acesso, ele representa a autorização combinada e pode ser usado
  para qualquer um dos valores de `scope` incluídos na resposta.
- A autorização combinada inclui todos os escopos que o usuário concedeu ao
  projeto da API, mesmo que as concessões tenham sido solicitadas de clientes
  diferentes. Por exemplo, se um usuário conceder acesso a um escopo usando o
  cliente de computador de um aplicativo e depois conceder outro escopo ao mesmo
  aplicativo usando um cliente móvel, a autorização combinada vai incluir os
  dois escopos.
- Se você revogar um token que representa uma autorização combinada, o acesso a
  todos os escopos dessa autorização em nome do usuário associado será revogado
  simultaneamente.

Os exemplos de código específicos da linguagem em
[Etapa 1: definir parâmetros de autorização](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#creatingclient)
e o URL de redirecionamento HTTP/REST de amostra em
[Etapa 2: redirecionar para o servidor OAuth 2.0 do Google](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#redirecting)
usam a autorização incremental. As amostras de código abaixo também mostram o
código que você precisa adicionar para usar a autorização incremental.

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

```
<span>$client-&gt;setIncludeGrantedScopes(true);</span>
```

## Como atualizar um token de acesso (acesso off-line)

Os tokens de acesso expiram periodicamente e se tornam credenciais inválidas
para uma solicitação de API relacionada. É possível atualizar um token de acesso
sem solicitar a permissão do usuário (inclusive quando ele não está presente) se
você solicitou acesso off-line aos escopos associados ao token.

- Se você usar uma biblioteca de cliente da API do Google, o
  [objeto cliente](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#creatingclient)
  vai atualizar o token de acesso conforme necessário, desde que você configure
  esse objeto para acesso off-line.
- Se você não estiver usando uma biblioteca de cliente, defina o parâmetro de
  consulta HTTP `access_type` como `offline` ao
  [redirecionar o usuário para o servidor OAuth 2.0 do Google](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#redirecting).
  Nesse caso, o servidor de autorização do Google retorna um token de
  atualização quando você
  [troca um código de autorização](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#exchange-authorization-code)
  por um token de acesso. Depois, se o token de acesso expirar (ou a qualquer
  momento), você poderá usar um token de atualização para conseguir um novo
  token de acesso.

A solicitação de acesso off-line é um requisito para qualquer aplicativo que
precise acessar uma API do Google quando o usuário não estiver presente. Por
exemplo, um app que realiza serviços de backup ou executa ações em horários
predeterminados precisa atualizar o token de acesso quando o usuário não está
presente. O estilo de acesso padrão é chamado de `online`.

Os aplicativos da Web do lado do servidor, os aplicativos instalados e os
dispositivos recebem tokens de atualização durante o processo de autorização. Os
tokens de atualização não são usados normalmente em aplicativos da Web do lado
do cliente (JavaScript).

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

Se o aplicativo precisar de acesso off-line a uma API do Google, defina o tipo
de acesso do cliente da API como `offline`:

```
<span>$client-&gt;setAccessType("offline");</span>
```

Depois que um usuário concede acesso off-line aos escopos solicitados, você pode
continuar usando o cliente da API para acessar as APIs do Google em nome do
usuário quando ele estiver off-line. O objeto cliente atualiza o token de acesso
conforme necessário.

## Revogação de token

Em alguns casos, um usuário pode querer revogar o acesso concedido a um
aplicativo. Um usuário pode revogar o acesso nas
[Configurações da conta](https://myaccount.google.com/permissions?hl=pt-br).
Consulte a seção
[Remover o acesso de sites ou apps do documento de suporte Sites e apps de terceiros com acesso à sua conta](https://support.google.com/accounts/answer/3466521?hl=pt-br#remove-access)
para mais informações.

Também é possível que um aplicativo revogue programaticamente o acesso concedido
a ele. A revogação programática é importante quando um usuário cancela a
inscrição, remove um aplicativo ou os recursos da API necessários para um app
mudaram significativamente. Em outras palavras, parte do processo de remoção
pode incluir uma solicitação de API para garantir que as permissões concedidas
anteriormente ao aplicativo sejam removidas.

[PHP](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#php)
[Python](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#python)
[Ruby](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#ruby)
[Node.js](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#node.js)
[HTTP/REST](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest)

Para revogar um token de forma programática, chame `revokeToken()`:

```
<span>$client-&gt;revokeToken();</span>
```

## Acesso com base no tempo

O acesso por tempo permite que um usuário conceda ao app acesso aos dados dele
por um período limitado para concluir uma ação. O acesso por tempo limitado está
disponível em alguns produtos do Google durante o fluxo de consentimento, aos
usuários a opção de conceder acesso por um período limitado. Um exemplo é a
[API Data Portability](https://developers.google.com/data-portability?hl=pt-br),
que permite uma transferência única de dados.

Quando um usuário concede acesso por tempo ao seu aplicativo, o token de
atualização expira após a duração especificada. Os tokens de atualização podem
ser invalidados antes em circunstâncias específicas. Consulte
[estes casos](https://developers.google.com/identity/protocols/oauth2?hl=pt-br#expiration)
para mais detalhes. O campo `refresh_token_expires_in` retornado na resposta da
[troca de código de autorização](https://developers.google.com/identity/protocols/oauth2/web-server?hl=pt-br#httprest_3)
representa o tempo restante até que o token de atualização expire nesses casos.

## Implementar a Proteção entre contas

Outra etapa para proteger as contas dos usuários é implementar a proteção entre
contas usando o serviço de proteção entre contas do Google. Com esse serviço,
você pode assinar notificações de eventos de segurança que fornecem informações
ao seu aplicativo sobre mudanças importantes na conta do usuário. Depois, use as
informações para tomar medidas dependendo de como você decide responder aos
eventos.

Alguns exemplos dos tipos de eventos enviados ao seu app pelo Serviço de
proteção entre contas do Google:

- `https://schemas.openid.net/secevent/risc/event-type/sessions-revoked`
- `https://schemas.openid.net/secevent/oauth/event-type/token-revoked`
- `https://schemas.openid.net/secevent/risc/event-type/account-disabled`

Consulte a página
[Proteger contas de usuário com a Proteção entre contas](https://developers.google.com/identity/protocols/risc?hl=pt-br)
para mais informações sobre como implementar a Proteção entre contas e a lista
completa de eventos disponíveis.
