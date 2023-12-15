#!/bin/bash
# Author: zendu 
# Date: 2021-10-22 11:02:54 
# Last Modified by:   zendu 
# Last Modified time: 2022-03-05 15:18:54 
# 增加了修改MD文件的img路径，上传到服务器的images文件夹
cd /Users/zendu/Downloads/ymBlog
rm .*un~ &> /dev/null

gsed -i 's#](img/#](https://ymlog.cn/images/#' source/_posts/*.md

gsed -i 's#src="img/#src="https://ymlog.cn/images/#' source/_posts/*.md

hexo g   
cp -r source/_posts/img/* public/images/
rsync -av --delete public root@tencent.cloud:/usr/share/nginx/

# gsed -i 's#](https://ymlog.cn/images/#](img/#' source/_posts/*.md

# 提交代码到gitee

git add .

current_date=$(date +'%Y-%m-%d %H:%M')

if [ "$#" -gt 0 ]; then
    commit_message="[$current_date] $1"
else
    commit_message="[$current_date]"
fi

git commit -m "$commit_message"

git push 