from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Schemes(models.Model):
    title = models.CharField(max_length=255, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    height = models.IntegerField(null=True)
    width = models.IntegerField(null=True)
    components = models.JSONField(blank=True,default=list,null=True)
    
    def __str__(self):
        return self.id, self.title