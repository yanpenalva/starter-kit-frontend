# Perfis

The frontend presents the API's RBAC roles as Perfis. It supports name search,
creation, custom-role renaming, permission review and permission updates. The
API remains authoritative for authorization, permission grant limits and
deletion of assigned roles. Permission slugs stay unchanged in requests; only
their displayed labels are translated to Brazilian Portuguese.

The `admin` role cannot be renamed, deleted or have its permissions changed.
The reserved names `admin` and `user` cannot be renamed. Rename validation is
displayed from the API response; assignment-related deletion refusals are
explained in the interface.
