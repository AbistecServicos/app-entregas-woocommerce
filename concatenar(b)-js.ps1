
# Diretório base do projeto
$baseDir = "C:\dev\app-entregas-woocommerce\frontend\src"

# Pasta onde o arquivo de saída será gerado
$outputDir = "C:\dev\app-entregas-woocommerce\frontend"

# Arquivo de saída
$outfile = "$outputDir\saida.txt"

# Remove arquivo anterior (se existir)
Remove-Item $outfile -ErrorAction SilentlyContinue

# Inicializa uma coleção mutável para as linhas da árvore
$treeLines = New-Object System.Collections.ArrayList

# Função para percorrer diretórios, concatenar arquivos e coletar linhas da árvore
function Traverse-And-Collect($dir, $indent = "", $baseDir, $parentFolder = "") {
    $items = Get-ChildItem -Path $dir -ErrorAction SilentlyContinue | Sort-Object -Property @{Expression={$_.PSIsContainer}; Descending=$true}, Name
    $fileCounter = 1
    $localTreeLines = New-Object System.Collections.ArrayList

    foreach ($item in $items) {
        $relativePath = $item.FullName.Replace($baseDir, "").TrimStart("\")
        $currentFolder = if ($parentFolder) { "$parentFolder/$($item.Name)" } else { $item.Name }

        if ($item.PSIsContainer) {
            $subTree = Traverse-And-Collect $item.FullName "$indent  " $baseDir $currentFolder
            # Forçar subTree a ser uma ArrayList
            $subTreeArray = New-Object System.Collections.ArrayList
            if ($subTree -is [string]) {
                $null = $subTreeArray.Add($subTree)
            } elseif ($subTree -and $subTree.Length -gt 0) {
                $null = $subTreeArray.AddRange($subTree)
            }
            # Só adiciona a pasta se houver arquivos relevantes na subárvore
            if ($subTreeArray.Count -gt 0) {
                $null = $localTreeLines.Add("$indent📦$currentFolder/")
                $null = $localTreeLines.AddRange($subTreeArray)
            }
        } else {
            # Inclui arquivos .js, .css, .ico e .json
            if ($item.Name -match "\.(js|css|ico|json)$") {
                Add-Content $outfile "// ========================================="
                Add-Content $outfile "// $fileCounter. $relativePath"
                Add-Content $outfile "// ========================================="
                Add-Content $outfile ""
                Get-Content $item.FullName -Raw -ErrorAction SilentlyContinue | Add-Content $outfile
                Add-Content $outfile "`n"
                $null = $localTreeLines.Add("$indent$fileCounter 📜$relativePath")
                $fileCounter++
            }
        }
    }
    return $localTreeLines.ToArray()
}

# Adiciona o root à árvore
$null = $treeLines.Add("📦src/")

# Inicia o traversal no baseDir
$subTree = Traverse-And-Collect $baseDir "" $baseDir
# Forçar subTree a ser uma ArrayList
$subTreeArray = New-Object System.Collections.ArrayList
if ($subTree -is [string]) {
    $null = $subTreeArray.Add($subTree)
} elseif ($subTree -and $subTree.Length -gt 0) {
    $null = $subTreeArray.AddRange($subTree)
}
if ($subTreeArray.Count -gt 0) {
    $null = $treeLines.AddRange($subTreeArray)
}

# Adiciona a seção da árvore no final
Add-Content $outfile "`n// ========================================="
Add-Content $outfile "// ÁRVORE DE DIRETÓRIOS"
Add-Content $outfile "// ========================================="
foreach ($line in $treeLines) {
    Add-Content $outfile $line
}

Write-Host "Arquivo 'saida.txt' gerado com sucesso em: $outputDir"
