# Builds a release of one project
# Removes config files from the release, so that they won't be overwritten when installing
# Creates .tar.gz files and uploads them to roethenmund.biz, so that the scripts on
# the target machines can wget and unzip them. 

Param(
    [Parameter(Mandatory)] [string] $csprojPath,
    [Parameter(Mandatory)] [string] $prefix,
    [Parameter(Mandatory)] [string] $target,
    [Parameter(Mandatory)] [string] $ftpUser,
    [Parameter(Mandatory)] [string] $ftpPassword
)
clear
$targetPath = "$target\bin"
$unwantedItems = @(
	"$targetPath\App_Data",
	"$targetPath\config",
	"$targetPath\*.pdb",
	"$targetPath\*.config",
	"$targetPath\appsettings.*",
	"$targetPath\config.*"
)
$releaseFile = ""
if (Test-Path -path $targetPath) {
	Remove-Item -Path $targetPath -Force -Recurse
}    
Write-Host ("Starting build") -ForegroundColor Blue
dotnet publish $csprojPath -o $targetPath --no-self-contained
if (Test-Path -path $targetPath) {
	Remove-Item -Path $unwantedItems -Force -Recurse -ErrorAction SilentlyContinue
	$tarFilePath = "$target\$prefix.tar"
	$targzFilePath = "$tarFilePath.gz"
	Remove-Item -Path $tarFilePath, $targzFilePath -ErrorAction SilentlyContinue
	Start-Sleep -Seconds 5
	7z a -r -ttar $tarFilePath $targetPath\*
	7z a -r -tgzip -mx9 $targzFilePath $tarFilePath
	$releaseFile = $targzFilePath
	Remove-Item -Path $tarFilePath
	Write-Host "Release built at $targetPath" -ForegroundColor Green
}else{
	Write-Host ("Build failed") -ForegroundColor red
}
if (Test-Path -path $releaseFile) {
	Write-Host "Start ftp upload" -ForegroundColor Blue
	$webclient = New-Object System.Net.WebClient
	$webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)
	$ftpServerPath = "ftp://roethenmund.biz/httpdocs/pilot/"
	$releaseFileName = $releaseFile | Split-Path -Leaf
	$uri = New-Object System.Uri("$ftpServerPath/$releaseFileName")
	$webclient.UploadFile($uri, $releaseFile)
	Write-Host "Release file uploaded: $releaseFileName" -ForegroundColor Green
	$webclient.Dispose()
}
Write-host "`n****************`n*   All done.  *`n****************" -ForegroundColor Green
