import { formatEmailFrom } from '@app-petlar/auth/email-from'
import { env } from '@app-petlar/env/server'

import { getEmailStyles } from '../email-styles'

interface OrgForEmail {
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  primaryForegroundColor: string | null
  backgroundColor: string | null
  foregroundColor: string | null
  accentColor: string | null
  mutedColor: string | null
  mutedForegroundColor: string | null
}

interface SendCatAdoptedNotificationEmailParams {
  to: string
  applicantName: string
  /**
   * Names of the cats the applicant was passed over for. One entry for a
   * regular adoption, N entries for a joint (group) adoption.
   */
  catNames: string[]
  org: OrgForEmail
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

/**
 * pt-BR natural list: ["Bob"] → "Bob"; ["Bob","Bela"] → "Bob e Bela";
 * ["Bob","Bela","Tico"] → "Bob, Bela e Tico"; > 3 → "Bob, Bela, Tico e mais N".
 */
export function formatCatNamesPtBR(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]!
  if (names.length === 2) return `${names[0]} e ${names[1]}`
  if (names.length === 3) return `${names[0]}, ${names[1]} e ${names[2]}`

  const rest = names.length - 3
  return `${names[0]}, ${names[1]}, ${names[2]} e mais ${rest}`
}

export async function sendCatAdoptedNotificationEmail(
  params: SendCatAdoptedNotificationEmailParams
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error('Configuração de e-mail não encontrada')
  }

  const isJoint = params.catNames.length > 1
  const catList = formatCatNamesPtBR(params.catNames)
  const safeApplicantName = escapeHtml(params.applicantName)
  const safeCatList = escapeHtml(catList)
  const safeOrgName = escapeHtml(params.org.name)
  const availableCatsUrl = `${env.CORS_ORIGIN}/${params.org.slug}`
  const styles = getEmailStyles(params.org)

  const subject = isJoint
    ? `Uma novidade da ${params.org.name} 🐾`
    : `Uma novidade sobre o ${catList} 🐾`

  const middleParagraph = isJoint
    ? `Temos uma novidade pra te contar: <strong>${safeCatList}</strong> encontraram juntos uma família que conseguiu acolher todos eles de uma vez — o que era o sonho pra essa turminha, que se dá muito bem estando junto. A gente sempre busca o lar que combina com o momento de vida de cada gato (ou de cada grupo!), e dessa vez foi essa família que fez o match. Mas isso não diminui em nada o carinho da sua candidatura.`
    : `Temos uma novidade pra te contar: o <strong>${safeCatList}</strong> encontrou uma família que se encaixou muito bem com as necessidades dele. Cada gatinho tem um jeitinho próprio — energia, medos, manhas, cuidados especiais — e a gente busca aquele lar que combina com o momento de vida de cada um. Dessa vez, foi outra família que fez esse match. Mas isso não diminui em nada o carinho da sua candidatura.`

  const openingParagraph = isJoint
    ? `Antes de qualquer coisa: <strong>muito obrigado</strong> por ter aberto seu coração para essa turminha. O simples fato de você ter preenchido a candidatura, contado sobre sua casa, sua rotina e sua vontade de acolher — isso já é gigante. Não passa despercebido pra gente.`
    : `Antes de qualquer coisa: <strong>muito obrigado</strong> por ter aberto seu coração para o <strong>${safeCatList}</strong>. O simples fato de você ter preenchido a candidatura, contado sobre sua casa, sua rotina e sua vontade de acolher — isso já é gigante. Não passa despercebido pra gente.`

  const text = [
    `Oi, ${params.applicantName}!`,
    '',
    isJoint
      ? `Antes de qualquer coisa: muito obrigado por ter aberto seu coração para essa turminha. Preencher a candidatura, contar sobre sua casa e sua vontade de acolher — isso já é gigante.`
      : `Antes de qualquer coisa: muito obrigado por ter aberto seu coração para o ${catList}. Preencher a candidatura, contar sobre sua casa e sua vontade de acolher — isso já é gigante.`,
    '',
    isJoint
      ? `Temos uma novidade: ${catList} encontraram juntos uma família que conseguiu acolher todos eles de uma vez. A gente sempre busca o lar que combina com o momento de vida de cada gato (ou de cada grupo!), e dessa vez foi essa família que fez o match. Mas isso não diminui em nada o carinho da sua candidatura.`
      : `Temos uma novidade: o ${catList} encontrou uma família que se encaixou muito bem com as necessidades dele. Cada gatinho tem um jeitinho próprio, e a gente busca o lar que combina com o momento de vida de cada um. Dessa vez, foi outra família que fez o match — mas isso não diminui em nada o carinho da sua candidatura.`,
    '',
    `E olha, temos uma ótima notícia: tem outros gatinhos incríveis na ${params.org.name} esperando por alguém como você. Talvez seu felino ideal esteja te esperando agora mesmo.`,
    '',
    `Conheça os gatinhos disponíveis: ${availableCatsUrl}`,
    '',
    `Se tiver dúvidas ou quiser conversar, é só responder este email.`,
    '',
    `Com muito carinho,`,
    `Equipe ${params.org.name}`,
  ].join('\n')

  const logoBlock = params.org.logoUrl
    ? `
      <tr>
        <td align="center" style="padding:22px 24px 6px 24px;background:${styles.background};">
          <img src="${escapeHtml(params.org.logoUrl)}" alt="${safeOrgName}" width="72" height="72" style="display:block;border:0;border-radius:16px;object-fit:cover;" />
        </td>
      </tr>`
    : ''

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Uma novidade da ${safeOrgName}</title>
      </head>
      <body style="margin:0;padding:0;background:${styles.background};">
        <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
          Uma atualização carinhosa da ${safeOrgName} sobre sua candidatura.
        </span>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${styles.muted};border-radius:22px;overflow:hidden;">
                ${logoBlock}
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${styles.background};">
                      <tr>
                        <td style="padding:22px 24px 20px 24px;text-align:center;">
                          <h1 style="margin:0 0 8px 0;color:${styles.foreground};font-family:'Outfit','DM Sans',Segoe UI,Arial,sans-serif;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.3px;">
                            Uma novidade com carinho 💛
                          </h1>
                          <p style="margin:0;color:${styles.foreground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;opacity:0.85;">
                            Da equipe da <strong>${safeOrgName}</strong> pra você.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:26px 26px 4px 26px;">
                    <p style="margin:0 0 14px 0;color:${styles.foreground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:16px;line-height:1.6;">
                      Oi, <strong>${safeApplicantName}</strong>! 💛
                    </p>
                    <p style="margin:0 0 16px 0;color:${styles.foreground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.65;">
                      ${openingParagraph}
                    </p>
                    <p style="margin:0 0 16px 0;color:${styles.foreground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.65;">
                      ${middleParagraph}
                    </p>
                    <p style="margin:0 0 20px 0;color:${styles.foreground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.65;">
                      E olha, temos uma <strong>ótima notícia</strong>: tem outros gatinhos incríveis na <strong>${safeOrgName}</strong> esperando por alguém como você. Cada um com sua história, sua personalidade, seu jeito único de amar. Talvez seu felino ideal esteja te esperando agora mesmo. 🥺
                    </p>

                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px 0;">
                      <tr>
                        <td align="center">
                          <a href="${escapeHtml(availableCatsUrl)}" style="display:inline-block;background:${styles.primary};color:${styles.primaryForeground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 26px;border-radius:14px;letter-spacing:0.2px;">
                            Conheça os gatinhos disponíveis →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 4px 0;color:${styles.foreground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.6;opacity:0.9;">
                      Se tiver dúvidas, quiser conversar sobre um gatinho específico ou precisar de qualquer coisa, é só responder este email. Estamos aqui.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 26px 24px 26px;">
                    <p style="margin:0;color:${styles.foreground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;">
                      Com muito carinho,<br />
                      <strong>Equipe ${safeOrgName}</strong> 🐾
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="border-top:1px solid ${styles.muted};background:#ffffff;padding:14px 26px;">
                    <p style="margin:0;color:${styles.mutedForeground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.55;">
                      Você recebeu este email porque se candidatou à adoção pela plataforma PetLar.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:12px 0 0 0;color:${styles.mutedForeground};font-family:'DM Sans',Segoe UI,Arial,sans-serif;font-size:11px;line-height:1.4;">
                PetLar • Sistema de adoção responsável
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: formatEmailFrom(params.org.name),
      to: [params.to],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Falha ao enviar e-mail (${response.status}): ${body}`)
  }
}
