foreach ($file in Get-ChildItem .\states\*) {
    $FilePath = Join-Path -Path ./states/ -ChildPath $file.Name
    $target = get-item $FilePath
    if($target.PSIsContainer) {
        echo $FilePath
        git add $FilePath
        git commit -m "add $FilePath files"
    }
}