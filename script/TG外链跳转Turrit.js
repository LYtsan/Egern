#!name=Tg外链跳转重定向
#!desc=Tg重定向外链跳转，至第三方客户端turrit
#!author=麻衣
#!icon=https://raw.githubusercontent.com/LovedGM/Quantumult-X-TuBiao/main/YYY/yyy5.png
#!tag=樱岛,麻衣

[URL Rewrite]
(https:\/\/)?t.me\/(.+) turrit://resolve?domain=$2 302

[MITM]
hostname = %APPEND% t.me