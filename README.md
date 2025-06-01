<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#security-warning">Security Warning</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
  </ol>
</details>


<!-- ABOUT THE PROJECT -->
## About The Project

A simple React chat application with WebSocket integration written in C.<br>
Why in C you might ask?<br>
Well because I wanted to test myself and also see how it ALL actually works.<br>
And because of this I've learned quite a bit about low level networking, mainly TCP.<br>


### Built With

* [![React][React.js]][React-url]
* [![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express)](https://expressjs.com/)
* [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
* [![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
* ![C](https://img.shields.io/badge/C-00599C?style=for-the-badge&logo=c&logoColor=white)
* [![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
  
<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Getting Started

#### Required Tools

- **npm**
  ```sh
  npm install npm@latest -g
  ```

- **GCC**
  - On **Windows** (via Cygwin, MSYS2, or WSL)
  - On **Linux**, usually pre-installed or available via package manager:
    ```sh
    sudo apt update && sudo apt install build-essential libssl-dev libmysqlclient-dev
    ```

- **MySQL development libraries** (for C server):
  - On **Windows**: Ensure MySQL development headers/libraries are installed and accessible via your C environment.
  - On **Linux**:
    ```sh
    sudo apt install libmysqlclient-dev
    ```

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/magzzy124/chat-app.git
   cd chat-app
   ```

2. Install NPM packages in both the **root** folder and **server** folder:
   ```sh
   npm install
   cd server
   npm install
   ```

3. Compile and run the C WebSocket server:

   #### On Windows (with Cygwin/MSYS2/WSL):
   ```sh
   cd /cygdrive/c/Users/danil/Documents/ViteReact/chat-app/WebsocketServer
   gcc -o server server.c db_utils.c -lssl -lcrypto -I/usr/include/mysql -L/usr/lib/mysql -lmysqlclient
   ./server
   ```

   #### On Linux:
   ```sh
   cd ~/chat-app/WebsocketServer
   gcc -o server server.c db_utils.c -lssl -lcrypto -I/usr/include/mysql -L/usr/lib/mysql -lmysqlclient
   ./server
   ```

<!-- USAGE EXAMPLES -->
## Usage
Easiest way to the this app is to create 2 guest accounts on 2 different tabs. (This app uses session storage) </br>
In this way, you can see in realtime how messages are being sent, how the seen/sent status works, group creations etc.

> ⚠️ **Warning**
>
> This application does **not** implement SSL encryption. It is intended for **local development use only**.
> Do **not** deploy this to the public internet without adding proper HTTPS and other security measures.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Add SSL encryption on the websocket server
- [ ] Add the ability to edit and remove a message
- [ ] Host the application on a VPS, so that everyone can use a demo
    - [ ] Store the messages in the local database (only after the app is hosted)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/othneildrew/Best-README-Template/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=for-the-badge
[forks-url]: https://github.com/othneildrew/Best-README-Template/network/members
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge
[stars-url]: https://github.com/othneildrew/Best-README-Template/stargazers
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=for-the-badge
[issues-url]: https://github.com/othneildrew/Best-README-Template/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/othneildrew/Best-README-Template/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/othneildrew
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com 
