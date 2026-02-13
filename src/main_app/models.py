from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Schemes(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=False)
    data = models.JSONField(blank=True,default=list,null=True)
    
    
    def __str__(self):
        return self.id, self.title
    
class Components(models.Model):
    title = models.CharField(max_length=100, null=False)
    ico = models.ImageField(upload_to='components/')
    
    def __str__(self):
        return self.id, self.title