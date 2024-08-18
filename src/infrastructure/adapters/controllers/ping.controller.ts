import { Controller, Get } from '@nestjs/common';

   @Controller()
   export class PingController {
     @Get()
     getHello(): string {
       return 'Hola Mundo!';
     }

     @Get('health')
     getHealth(): { status: string } {
       return { status: 'OK' };
     }
   }
   