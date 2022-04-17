#!/bin/bash

npm run build
cd build
tar -czf ../swarm.release.tar.gz *
cd ..
scp swarm.release.tar.gz root@vega.x.ks.ua:/var/www/swarm
ssh root@vega.x.ks.ua "cd /var/www/swarm && tar -xvf swarm.release.tar.gz"
