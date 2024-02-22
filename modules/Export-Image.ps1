param(
    [Parameter(Mandatory=$true)]
    [string]$libPath,
    [string]$workflowPath=".\workflows",
    [string]$bootstrapperPath="..\.bonsai\Bonsai.exe"
)

foreach ($file in Get-ChildItem (Join-Path $workflowPath "*.bonsai")) {
    &$bootstrapperPath --lib (Resolve-Path $libPath) --export-image "$($file.BaseName).svg" $file
}