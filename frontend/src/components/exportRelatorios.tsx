import { Button, Stack, Typography } from "@mui/material"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"

type ExportRelatoriosProps = {
  content: string
  title?: string
  fileBaseName?: string
  disabled?: boolean
}

export function ExportRelatorios({ content, title = "Relatório RAJAI", fileBaseName = "relatorio-rajai", disabled }: ExportRelatoriosProps) {
  const hasContent = Boolean(content?.trim())
  const isDisabled = disabled || !hasContent

  const stripMarkdown = (text: string) => {
    // remove code fences
    let cleaned = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    // headings, blockquotes, lists
    cleaned = cleaned.replace(/^\s{0,3}(#{1,6}|>|-|\*|\+)\s?/gm, "")
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, "")
    // emphasis
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, "$2")
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, "$2")
    // inline code
    cleaned = cleaned.replace(/`([^`]+)`/g, "$1")
    // extra pipes/spaces from tables
    cleaned = cleaned.replace(/\|/g, " | ")
    // collapse multiple spaces
    cleaned = cleaned.replace(/[ \t]{2,}/g, " ")
    return cleaned.trim()
  }

  const exportPdf = () => {
    if (!hasContent) return
    const plain = stripMarkdown(content)
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(title, 14, 18)
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(plain, 180)
    doc.text(lines, 14, 28)
    doc.save(`${fileBaseName}.pdf`)
  }

  const exportXlsx = () => {
    if (!hasContent) return
    const plain = stripMarkdown(content)
    const rows = plain.split("\n").map((line) => [line])
    const sheet = XLSX.utils.aoa_to_sheet([["Relatório RAJAI"], ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, "Relatorio")
    XLSX.writeFile(wb, `${fileBaseName}.xlsx`)
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" color="text.secondary">
        Exportar relatório:
      </Typography>
      <Button variant="outlined" size="small" onClick={exportPdf} disabled={isDisabled}>
        PDF
      </Button>
      <Button variant="outlined" size="small" onClick={exportXlsx} disabled={isDisabled}>
        XLSX
      </Button>
    </Stack>
  )
}
