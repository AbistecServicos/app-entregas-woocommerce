# Diretório base do projeto
$baseDir = "C:\dev\app-entregas-woocommerce\frontend"

# Pasta onde o arquivo de saída será gerado
$outputDir = "C:\dev\app-entregas-woocommerce\doc"

# Arquivo de saída
$outfile = "$outputDir\saida.txt"

# Remove arquivo anterior (se existir)
Remove-Item $outfile -ErrorAction SilentlyContinue

# Inicializa coleções mutáveis para armazenar os dados
$treeLines = New-Object System.Collections.ArrayList
$fileContents = New-Object System.Collections.ArrayList

# Função para percorrer diretórios, concatenar arquivos e coletar linhas da árvore
function Get-AndCollect($dir, $indent = "", $baseDir, $parentFolder = "") {
    # Lista os itens no diretório atual
    $items = Get-ChildItem -Path $dir -ErrorAction SilentlyContinue | Sort-Object -Property @{Expression={$_.PSIsContainer}; Descending=$true}, Name
    $fileCounter = 1
    $localTreeLines = New-Object System.Collections.ArrayList

    foreach ($item in $items) {
        $relativePath = $item.FullName.Replace($baseDir, "").TrimStart("\")
        $currentFolder = if ($parentFolder) { "$parentFolder/$($item.Name)" } else { $item.Name }

        if ($item.PSIsContainer) {
            # Ignora node_modules e .next (não queremos na árvore)
            if ($item.Name -in @("node_modules", ".next")) { continue }

            # Processa subdiretórios recursivamente
            $subTree = Get-AndCollect $item.FullName "$indent  " $baseDir $currentFolder

            # Adiciona a pasta à árvore, mesmo que não contenha arquivos relevantes
            $null = $localTreeLines.Add("$indent📦$currentFolder/")
            foreach ($line in $subTree) {
                $null = $localTreeLines.Add($line)
            }
        } else {
            # Inclui arquivos relevantes (js, css, ico, json, txt, ps1, config, env, ignore)
            if ($item.Name -match "\.(js|css|ico|json|txt|ps1|config.js)$" -or
                $item.Name -match "^(\.env|\.gitignore|package\.json|package-lock\.json|vercel\.json)$") {

                # Coleta o conteúdo do arquivo (mesmo que esteja vazio)
                $content = Get-Content $item.FullName -Raw -ErrorAction SilentlyContinue
                $null = $fileContents.Add("// =========================================")
                $null = $fileContents.Add("// $fileCounter. $relativePath")
                $null = $fileContents.Add("// =========================================")
                $null = $fileContents.Add("")
                if ($content) {
                    $null = $fileContents.Add($content)
                } else {
                    $null = $fileContents.Add("<ARQUIVO VAZIO>")
                }
                $null = $fileContents.Add("`n")

                # Adiciona o arquivo à árvore local
                $null = $localTreeLines.Add("$indent$fileCounter 📜$relativePath")
                $fileCounter++
            }
        }
    }
    return $localTreeLines.ToArray()
}

# Define os diretórios principais a serem processados
$mainDirs = @("src", "lib", "public", "tests")

# Adiciona o root à árvore
$null = $treeLines.Add("📦frontend/")

# Processa cada diretório principal
foreach ($dir in $mainDirs) {
    $fullDirPath = Join-Path $baseDir $dir
    if (Test-Path $fullDirPath) {
        $subTree = Get-AndCollect $fullDirPath "" $baseDir
        foreach ($line in $subTree) {
            $null = $treeLines.Add($line)
        }
    }
}

# Escreve o conteúdo no arquivo de saída
$fileContents | Add-Content $outfile
Add-Content $outfile "`n// ========================================="
Add-Content $outfile "// ÁRVORE DE DIRETÓRIOS"
Add-Content $outfile "// ========================================="
$treeLines | Add-Content $outfile

Write-Host "Arquivo 'saida.txt' gerado com sucesso em: $outputDir"