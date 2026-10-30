// 给图片添加注释
function addNoteForImg() {
    let imgEles = Array.from(document.querySelectorAll('.article-content.markdown-body img'));
    imgEles.forEach((imgEle) => {
        if(imgEle.alt){
            let noteEle = document.createElement("div");
            noteEle.innerHTML = imgEle.alt + '<br>';
            noteEle.style.setProperty('text-align', 'center');
            noteEle.style.setProperty('color', '#ccc');
            noteEle.style.setProperty('font-size', '14px');
            noteEle.style.setProperty('margin-bottom', '20px');
            // noteEle.style.setProperty('width', 'fit-content');
            // noteEle.style.setProperty('border-bottom', '1px solid #ccc');
            imgEle.parentElement.appendChild(noteEle);
        }
    })
}



window.addEventListener('DOMContentLoaded', addNoteForImg);