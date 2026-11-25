# Export the deck to PDF (submission) and PNGs (visual QA) using PowerPoint
param([string]$Deck = "$PSScriptRoot\Renew_and_Upgrade_Proposal.pptx", [string]$PngDir = "$PSScriptRoot\render")
$pdf = [IO.Path]::ChangeExtension($Deck, ".pdf")
New-Item -ItemType Directory -Force $PngDir | Out-Null
Get-ChildItem $PngDir -Filter *.png | Remove-Item -Force
$pp = New-Object -ComObject PowerPoint.Application
$p = $pp.Presentations.Open($Deck, $true, $false, $false)
$p.SaveAs($pdf, 32)  # ppSaveAsPDF
$i = 1; foreach ($s in $p.Slides) { $s.Export((Join-Path $PngDir ("slide-{0:D2}.png" -f $i)), "PNG", 1600, 900); $i++ }
$p.Close(); $pp.Quit()
Write-Output "PDF: $pdf"; Get-ChildItem $PngDir | Select-Object -ExpandProperty FullName
