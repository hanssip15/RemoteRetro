import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../services/user.service';
import { Request, Response } from 'express';


@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService, private usersService: UsersService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { name, email, imageUrl } = req.user as { id: string; name: string; email: string; imageUrl: string };
    
    console.log('Google user data:', { name, email, imageUrl });
    
    let user = await this.usersService.findByEmail(email);
    console.log('Existing user:', user);

    if (!user) {
      // Create new user if not found (id will be auto-generated)
      // Use fallback values if Google doesn't provide them
      const userData = { 
        name: name || 'Unknown User', 
        email, 
        imageUrl: imageUrl || null 
      };
      console.log('Creating new user with data:', userData);
      
      user = await this.usersService.create(userData);
      console.log('Created user:', user);
    }
    if (!user) {
      return res.status(500).json({ message: 'Failed to create or retrieve user.' });
    }
    const payload = { 
      sub: user!.id, 
      email: user!.email, 
      name: user!.name, 
      imageUrl: user!.imageUrl || null 
    };
    const token = this.jwtService.sign(payload);

    // Prepare user data for frontend
    const userData = {
      id: user!.id,
      email: user!.email,
      name: user!.name,
      imageUrl: user!.imageUrl || null
    };

    // Send token and user data to frontend
    const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
    return res.redirect(`http://localhost:5173/auth/callback?token=${token}&userData=${userDataEncoded}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Req() req: Request) {
    // req.user contains the decoded JWT payload
    const user = req.user as any;
    return {
      id: user?.sub,
      email: user?.email,
      name: user?.name,
      imageUrl: user?.imageUrl
    };
  }
}
