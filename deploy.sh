#!/bin/bash
# Author: zendu 
# Last Modified by:   zendu 
# Last Modified time: 2023-12-15 15:18:54 
# 增加了修改MD文件的img路径，上传到服务器的images文件夹


# cd /Users/zendu/Downloads/ymBlog
# rm .*un~ &> /dev/null
# gsed -i 's#](img/#](https://ymlog.cn/images/#' source/_posts/*.md
# gsed -i 's#src="img/#src="https://ymlog.cn/images/#' source/_posts/*.md
# hexo g   
# cp -r source/_posts/img/* public/images/
# rsync -av --delete public root@tencent.cloud:/usr/share/nginx/
# gsed -i 's#](https://ymlog.cn/images/#](img/#' source/_posts/*.md

# git config --global core.autocrlf true

# https://ymlog.cn/images -> /img/
cp -r source/_posts/img source/

git add .
current_date=$(date +'%Y-%m-%d %H:%M')
if [ "$#" -gt 0 ]; then
    commit_message="[$current_date] $1"
else
    commit_message="[$current_date]"
fi
git commit -m "$commit_message"
git push 