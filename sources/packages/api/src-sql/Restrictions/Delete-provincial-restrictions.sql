--Delete the newly created provincial restrictions.
delete from
    sims.restrictions
where
    restriction_type = 'Provincial';