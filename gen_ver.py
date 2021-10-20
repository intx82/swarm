#!/usr/bin/env python3

import datetime
import git
import os

repo = git.Repo(os.getcwd(), search_parent_directories=True)
branch = repo.active_branch.name
commit = list(repo.iter_commits(branch, max_count=1))[0]
print(f'"R{(datetime.datetime.now().year-2000):02d}{datetime.datetime.now().month:02d}{datetime.datetime.now().day:02d};{branch};{commit.hexsha}"')
