import os
import subprocess

current_dir = os.path.dirname(os.path.abspath(__file__))
docx_path = os.path.join(current_dir, "BAO_CAO_KHAO_SAT_HE_THONG_VINDINING.docx")

ps_code = f"""
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$path = [System.IO.Path]::GetFullPath('{docx_path}')
$doc = $word.Documents.Open($path)
$pages = $doc.ComputeStatistics(2)
Write-Host "Total Pages: $pages"

for ($i = 1; $i -le $pages; $i++) {{
    $range = $doc.GoTo(1, 1, $i) # 1 = wdGoToPage, 1 = wdGoToAbsolute
    $nextRange = $doc.GoTo(1, 1, $i + 1)
    if ($i -eq $pages) {{
        $endPos = $doc.Content.End
    }} else {{
        $endPos = $nextRange.Start
    }}
    $pageRange = $doc.Range($range.Start, $endPos)
    $firstLine = $pageRange.Paragraphs[1].Range.Text.Trim()
    Write-Host "Page $i start: $firstLine"
}}

$doc.Close(0)
$word.Quit()
"""

with open("docs/phase1/temp_pages.ps1", "w", encoding="utf-8-sig") as f:
    f.write(ps_code)

res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "docs/phase1/temp_pages.ps1"], capture_output=True, text=True, encoding="utf-8", errors="replace")
with open("docs/phase1/page_breakdown.txt", "w", encoding="utf-8") as f:
    f.write(res.stdout)
print("Saved breakdown to docs/phase1/page_breakdown.txt")
if os.path.exists("docs/phase1/temp_pages.ps1"):
    os.remove("docs/phase1/temp_pages.ps1")
