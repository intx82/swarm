#!/bin/bash

npm run build
cd build
tar -czf ../swarm.release.tar.gz *
cd ..
scp swarm.release.tar.gz root@dlab.pw:/var/www/swarm
ssh root@dlab.pw "cd /var/www/swarm && tar -xvf swarm.release.tar.gz"
rm swarm.release.tar.gz