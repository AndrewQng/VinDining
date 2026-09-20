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
Write-Host "EXACT_PAGE_COUNT: $pages"
$doc.Close(0)
$word.Quit()
"""

# Write with utf-8-sig (with BOM) so powershell reads Vietnamese characters properly
with open("docs/phase1/temp_script.ps1", "w", encoding="utf-8-sig") as f:
    f.write(ps_code)

res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", "docs/phase1/temp_script.ps1"], capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
