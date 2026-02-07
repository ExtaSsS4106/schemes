from random import randint
import eel

@eel.expose
def random_python():
    print("Random function running")
    return randint(1, 100)

@eel.expose
def say_hello(name):
    return f"Hello, {name}!"