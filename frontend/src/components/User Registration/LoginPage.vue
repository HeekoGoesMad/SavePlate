<template>
    <div class="login-container">
    <!-- Left Side: Empty for your own image -->
    <div class="login-left">
      <!-- Add your image or content here -->
    </div>
    <!-- Right Side: Login Form -->
    <div class="login-right">
      <!-- Logo Area (separate from form) -->
      <div class="logo">
        <img src="D:\STIKOM MATAKULIAH\Semester 6\Software Engineering\Assignment\code\SavePlate\frontend\src\assets\Save Plate Logo.png" width="350" height="130" alt="" />
      </div>

      <div class="form-wrapper">
        <p class="subtitle">Login into your account</p>
        <form @submit.prevent>
          <div class="input-group">
            <label for="email">Email :</label>
            <div class="input-container">
              <input type="email" id="email" placeholder="adribabi.com" />
              <span class="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </span>
            </div>
          </div>
          <div class="input-group">
            <label for="password">Password :</label>
            <div class="input-container">
              <input type="password" id="password" placeholder="NIGGA123" />
              <span class="icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
            </div>
          </div>
          <div class="forgot-password">
            <a href="#">Forgot password?</a>
          </div>
          <button type="submit" class="btn-login"> Login now </button>
          
        </form>
        <div class="divider">
          <span>OR</span>
        </div>
        <button type="button" class="btn-signup">Signup now</button>
      </div>
    </div>
  </div>
</template>

<style>

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
.login-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  font-family: "Inter", sans-serif;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
}
.login-left {
  flex: 1.5;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Add border or shadow here if you want separation */
}
.login-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 26px;
}
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
}
.form-wrapper {
  width: 100%;
  max-width: 750px;
  margin-bottom: 100px;
}
.subtitle {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  font-weight: 600;
}
.input-group {
  margin-bottom: 22px;
}
.input-group label {
  display: block;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 8px;
  font-weight: 500;
}
.input-container {
  display: flex;
  align-items: stretch;
  background-color: #f0f2f5;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}
.input-container:focus-within {
  border-color: #2da12b;
  box-shadow: 0 0 0 3px rgba(45, 161, 43, 0.1);
  background-color: #fff;
}
.input-container input {
  flex: 1;
  padding: 14px 16px;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: #333;
  outline: none;
}
.input-container input::placeholder {
  color: #999;
}
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  background-color: #2da12b;
  color: white;
  border-radius: 4px;
  margin: 3px;
  flex-shrink: 0;
}
.icon-wrapper svg {
  width: 20px;
  height: 20px;
}
.forgot-password {
  margin-bottom: 24px;
}
.forgot-password a {
  color: #2da12b;
  text-decoration: underline;
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.3s;
}
.forgot-password a:hover {
  color: #217d20;
}
.btn-login {
  width: 100%;
  padding: 14px;
  background-color: #2da12b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.3s,
    transform 0.1s;
  box-shadow: 0 4px 14px rgba(45, 161, 43, 0.15);
}
.btn-login:hover {
  background-color: #258c23;
  box-shadow: 0 6px 18px rgba(45, 161, 43, 0.2);
}
.btn-login:active {
  transform: scale(0.98);
}
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 28px 0;
  color: #bbb;
  font-size: 0.85rem;
}
.divider::before,
.divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}
.divider span {
  padding: 0 16px;
}
.btn-signup {
  width: 100%;
  padding: 14px;
  background-color: #ffffff;
  color: #2da12b;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
.btn-signup:hover {
  border-color: #2da12b;
  background-color: rgba(45, 161, 43, 0.03);
}
.btn-signup:active {
  transform: scale(0.98);
}
@media (max-width: 800px) {
  .login-container {
    flex-direction: column;
  }
  .login-left {
    display: none;
  }
}
</style>