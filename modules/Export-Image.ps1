param(
    [string[]]$libPath,
    [string]$workflowPath=".\workflows",
    [string]$bootstrapperPath="..\.bonsai\Bonsai.exe"
)

function Convert-Svg([string]$svgFile)
{
    [xml]$svgDOM = Get-Content $svgFile
    $namespaceURI = $svgDOM.DocumentElement.NamespaceURI
    $nsmgr = New-Object System.Xml.XmlNamespaceManager($svgDOM.NameTable)
    $nsmgr.AddNamespace("svg", $namespaceURI)

    # set transparent background
    $svgDOM.svg.rect.style = "fill:none;"

    # set responsive text style
    $svgStyle = $svgDOM.CreateElement("style", $namespaceURI)
    $svgStyle.InnerText = "text { fill: #000; } @media (prefers-color-scheme: dark) { text { fill: #eee; } }"
    [void]$svgDOM.SelectSingleNode("/svg:svg", $nsmgr).PrependChild($svgStyle)

    # remove default text style from all text nodes
    foreach ($textElement in $svgDOM.SelectNodes("//svg:text", $nsmgr)) {
        $textElement.style = $textElement.style.replace("fill:rgb(0,0,0);", "")
    }

    $svgDOM.Save($svgFile)
}

function Export-Svg([string[]]$libPath, [string]$svgFileName, [string]$workflowFile)
{
    $bootstrapperArgs = @()
    foreach ($path in $libPath) {
        $bootstrapperArgs += "--lib"
        $bootstrapperArgs += "`"$(Resolve-Path $path)`""
    }
    $bootstrapperArgs += "--export-image"
    $bootstrapperArgs += "`"$svgFileName`""
    $bootstrapperArgs += "`"$workflowFile`""

    &$bootstrapperPath $bootstrapperArgs
}

$sessionPath = $ExecutionContext.SessionState.Path
foreach ($workflowFile in Get-ChildItem (Join-Path $workflowPath "*.bonsai")) {
    $svgFileName = "$($workflowFile.BaseName).svg"
    $svgFile = $sessionPath.GetUnresolvedProviderPathFromPSPath((Join-Path $workflowPath $svgFileName))
    Export-Svg $libPath $svgFileName $workflowFile
    Convert-Svg $svgFile
}