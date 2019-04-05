# instructor/ta
    => delete comments (owner of comment)
    => approve [inreview/reviewed] of comments (if project is ['moderated'])

# user
    => set own project to public or private
    => set own comments to public or private (approved/unapproved aka visibility is separate)
    => potentially private work is visible to a user' whitelist?

    777 - user/group[whitelist]/other[public]

# grabWhitelist.php
    => list of a group of students instructors/ta's (moderators)
    => different students may have different instructors/ta's (moderators)

# grabModeratedPages.php
    visibility for comments & approving them via admin

# MISC:
    - Change annotation header box color to same as the blue one
    - Top right box should say "filter by"...
    - Remove the ".HTML" when choosing documents (UI)
    - Make width bigger to see your email address
    - See if she can design a better annotation box
    - Scaling/Mobile Friendly (Bootstrap, custom color SCSS theme?)
    - Cancel button for annotations too
    - Private top right to personal
    - Unapproved or approved comments... Professor approves them
    - Files within the /parts directory should be an api endpoint

    - remove first part of path in get_comments/
    e.g. (../../users/ikleiman@stonybrook.edu/works/Something/data/)

# works
    -private/public

# comment
    - approved/unapproved
        - approved by permissions.json/admins of the work.

    - private (only self)
