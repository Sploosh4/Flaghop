"""State aliases for existing plugins and tests while callers move to service APIs."""


class OwnedState:
    def __init__(self, owner, attribute, factory):
        self.owner = owner
        self.attribute = attribute
        self.factory = factory

    def __get__(self, instance, owner=None):
        if instance is None:
            return self
        return getattr(getattr(instance, self.owner), self.attribute)

    def __set__(self, instance, value):
        if self.owner not in instance.__dict__:
            # Supports legacy test/plugin objects built without the runtime constructor.
            instance.__dict__[self.owner] = self.factory()
        setattr(instance.__dict__[self.owner], self.attribute, value)
