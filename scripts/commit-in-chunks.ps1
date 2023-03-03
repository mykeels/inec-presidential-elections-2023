foreach ($file in Get-ChildItem .\results\*) {
    $FilePath = Join-Path -Path ./results/ -ChildPath $file.Name
    $target = get-item $FilePath
    if($target.PSIsContainer) {
        echo $FilePath
        git add $FilePath
        git commit -m "add $FilePath files"
    }
}