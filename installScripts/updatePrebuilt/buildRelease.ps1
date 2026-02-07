# Builds releases of one project for different dotnet versions.
# Removes config files from the release, so that they won't be overwritten when installing
# Creates .tar.gz files and uploads them to roethenmund.biz, so that the scripts on
# the target machines can wget and unzip them. 

Param(
    [Parameter(Mandatory)] [string] $csprojPath,
    [Parameter(Mandatory)] [string] $prefix,
    [Parameter(Mandatory)] [string] $target,
    [Parameter(Mandatory)] [string] $ftpUser,
    [Parameter(Mandatory)] [string] $ftpPassword,
	[string] $sqlPath
)
clear
$frameworks = @('net8.0', 'net9.0')
$releaseFiles = @()
for ( $i = 0; $i -lt $frameworks.Count; $i++) {
    $version = $frameworks[$i]
    $targetPath = "$target\$version"
	$appTargetPath = "$targetPath\app"
	$unwantedItems = @(
		"$appTargetPath\App_Data",
		"$appTargetPath\config",
		"$appTargetPath\*.pdb",
		"$appTargetPath\*.config",
		"$appTargetPath\appsettings.*",
		"$appTargetPath\config.*"
	)
	if (Test-Path -path $targetPath) {
		Remove-Item -Path $targetPath -Force -Recurse
	}    
	Write-Host ("Starting build for version $version") -ForegroundColor Blue
	dotnet publish $csprojPath -o $appTargetPath -f $version --no-self-contained
	if ($sqlPath) {
        Write-Host "Copy db files"
        $dbTargetPath = "$targetPath\db"
        if (!(Test-Path $dbTargetPath)) {
            New-Item -ItemType Directory -Path $dbTargetPath | Out-Null
        }
		Copy-Item -Path "$sqlPath\*.sql" -Destination $dbTargetPath
	} 
	if (Test-Path -path $targetPath) {
		Remove-Item -Path $unwantedItems -Force -Recurse -ErrorAction SilentlyContinue
		$tarFilePath = "{0}\{1}_{2}.tar" -f $target, $prefix, $version 
		$targzFilePath = "$tarFilePath.gz"
		Remove-Item -Path $tarFilePath, $targzFilePath -ErrorAction SilentlyContinue
		Start-Sleep -Seconds 5
		7z a -r -ttar $tarFilePath $targetPath\*
		7z a -r -tgzip -mx9 $targzFilePath $tarFilePath
		$releaseFiles += $targzFilePath
		Remove-Item -Path $tarFilePath
		Write-Host "Release built at $appTargetPath" -ForegroundColor Green
	}else{
		Write-Host ("Build failed") -ForegroundColor red
	}
}
Write-Host "Start ftp upload" -ForegroundColor Blue
$webclient = New-Object System.Net.WebClient
$webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPassword)
$ftpServerPath = "ftp://roethenmund.biz/httpdocs/pilot/"
#for ( $i = 0; $i -lt $releaseFiles.Count; $i++) {
#    $releaseFile = $releaseFiles[$i]
#	$releaseFileName = $releaseFile | Split-Path -Leaf
#	$uri = New-Object System.Uri("$ftpServerPath/$releaseFileName")
#	$webclient.UploadFile($uri, $releaseFile)
#	Write-Host "Release file uploaded: $releaseFileName" -ForegroundColor Green
#}
$webclient.Dispose()

Write-host "`n****************`n*   All done.  *`n****************" -ForegroundColor Green
