Param(
    [Parameter(Mandatory)] [string] $csprojPath,
    [Parameter(Mandatory)] [string] $prefix,
    [Parameter(Mandatory)] [string] $target,
    [Parameter(Mandatory)] [string] $ftpUser,
    [Parameter(Mandatory)] [string] $ftpPassword
)
clear
$targets = @(@('net9.0', 'linux-arm64'), @('net8.0', 'linux-arm'), @('net9.0', 'win-x86'))
$releaseFiles = @()
for ( $i = 0; $i -lt $targets.Count; $i++)
{
    $version = $targets[$i][0]
    $architecture = $targets[$i][1]
    $targetPath = "{0}\{1}_{2}" -f $target, $version, $architecture
    $unwantedItems = @(
        "$targetPath\App_Data",
        "$targetPath\config",
        "$targetPath\*.pdb",
        "$targetPath\*.config",
        "$targetPath\appsettings.*",
        "$targetPath\config.*"
    )
    if (Test-Path -path $targetPath) {
        Remove-Item -Path $targetPath -Force -Recurse
    }    
    Write-Host ("Starting build for version: $version, architecture: $architecture") -ForegroundColor Blue
    dotnet publish $csprojPath -o $targetPath -r $architecture -f $version --no-self-contained
    if (Test-Path -path $targetPath) {
        Remove-Item -Path $unwantedItems -Force -Recurse -ErrorAction SilentlyContinue
        $tarFilePath = "{0}\{1}_{2}_{3}.tar" -f $target, $prefix, $version, $architecture
        $targzFilePath = "$tarFilePath.gz"
        Remove-Item -Path $tarFilePath, $targzFilePath -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 5
        7z a -r -ttar $tarFilePath $targetPath\*
        7z a -r -tgzip -mx9 $targzFilePath $tarFilePath
        $releaseFiles += $targzFilePath
        Remove-Item -Path $tarFilePath
        Write-Host "Release built at $targetPath" -ForegroundColor Green
    }else{
        Write-Host ("Build failed for version: $version, architecture: $architecture") -ForegroundColor red
    }
}
Write-Host "Start ftp upload" -ForegroundColor Blue
$webclient = New-Object System.Net.WebClient
$webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)
$ftpServerPath = "ftp://roethenmund.biz/httpdocs/pilot/"
for ( $i = 0; $i -lt $releaseFiles.Count; $i++){
    $releaseFilePath = $releaseFiles[$i]
    $releaseFileName = $releaseFilePath | Split-Path -Leaf
    $uri = New-Object System.Uri("$ftpServerPath/$releaseFileName")
    $webclient.UploadFile($uri, $releaseFilePath)
    Write-Host "Release file uploaded: $releaseFileName" -ForegroundColor Green
}
$webclient.Dispose()
Write-host "`n****************`n*   All done.  *`n****************" -ForegroundColor Green
