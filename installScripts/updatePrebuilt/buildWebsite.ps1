# Creates a package containing the entire website for the pilot web application
# Removes config files from the release, so that they won't be overwritten when installing
# Creates a .tar.gz file and uploads it to roethenmund.biz, so that the scripts on
# the target machines can wget and unzip it. 

Param(
    [Parameter(Mandatory)] [string] $projectPath,
   	[Parameter(Mandatory)] [string] $target,
    [Parameter(Mandatory)] [string] $ftpUser,
    [Parameter(Mandatory)] [string] $ftpPassword
)
clear

$targetPath = "$target\files"
$unwantedItems = "$targetPath\js\Config.*"
if (Test-Path -path $targetPath) {
	Remove-Item -Path $targetPath -Force -Recurse
}    
Write-Host ("Crating package with website files") -ForegroundColor Blue
xcopy /s /r /i  $projectPath\* $targetPath
Start-Sleep -Seconds 5
Remove-Item -Path $unwantedItems -Force -Recurse -ErrorAction SilentlyContinue
$tarFilePath = "$target\pilotweb.tar"
$targzFilePath = "$tarFilePath.gz"
Remove-Item -Path $tarFilePath, $targzFilePath -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5
7z a -r -ttar $tarFilePath $targetPath\*
7z a -r -tgzip -mx9 $targzFilePath $tarFilePath
Remove-Item -Path $tarFilePath
Write-Host "Website package created at $targetPath" -ForegroundColor Green
Write-Host "Start ftp upload" -ForegroundColor Blue
$webclient = New-Object System.Net.WebClient
$webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)
$ftpServerPath = "ftp://roethenmund.biz/httpdocs/pilot/"
$releaseFileName = $targzFilePath | Split-Path -Leaf
$uri = New-Object System.Uri("$ftpServerPath/$releaseFileName")
$webclient.UploadFile($uri, $targzFilePath)
Write-Host "Release file uploaded: $targzFilePath" -ForegroundColor Green
$webclient.Dispose()
Write-host "`n****************`n*   All done.  *`n****************" -ForegroundColor Green
