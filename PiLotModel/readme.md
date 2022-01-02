# PiLot
## PiLotModel
This C# / dotnet standard project contains business object classes used within different parts of the application. They don't contain much logic, as most business logic is implemented on the client, making the solution suitable for the low performance of a raspberry pi basically just storing and providing data. The classes contain serialization instructions, translating from PascalCase C# notation to camelCase javascript notation (jup, stubborn me).
