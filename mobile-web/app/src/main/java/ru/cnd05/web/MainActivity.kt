package ru.cnd05.web

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.CookieManager
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import ru.cnd05.web.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val mainHandler = Handler(Looper.getMainLooper())
    private var mainFrameFailed = false

    private val loadTimeout = Runnable {
        if (binding.progressBar.visibility == View.VISIBLE) {
            showError()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        CookieManager.getInstance().setAcceptCookie(true)

        binding.webView.setBackgroundColor(Color.WHITE)
        with(binding.webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            mediaPlaybackRequiresUserGesture = false
            // Без "; wv" некоторые CDN/антиботы хуже отдают страницу.
            userAgentString = userAgentString.replace("; wv", "")
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(binding.webView, true)

        binding.webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean = false

            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                mainFrameFailed = false
                binding.errorPanel.visibility = View.GONE
                binding.progressBar.visibility = View.VISIBLE
                mainHandler.removeCallbacks(loadTimeout)
                mainHandler.postDelayed(loadTimeout, 25_000)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                if (!mainFrameFailed) {
                    binding.progressBar.visibility = View.GONE
                    mainHandler.removeCallbacks(loadTimeout)
                }
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError,
            ) {
                if (request.isForMainFrame) {
                    mainFrameFailed = true
                    showError()
                }
            }

            override fun onReceivedSslError(
                view: WebView,
                handler: SslErrorHandler,
                error: SslError,
            ) {
                mainFrameFailed = true
                handler.cancel()
                showError()
            }

            @Deprecated("Deprecated in Java")
            override fun onReceivedError(
                view: WebView,
                errorCode: Int,
                description: String,
                failingUrl: String,
            ) {
                mainFrameFailed = true
                showError()
            }
        }

        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress >= 100 && !mainFrameFailed) {
                    binding.progressBar.visibility = View.GONE
                    mainHandler.removeCallbacks(loadTimeout)
                } else if (newProgress in 1..99 && !mainFrameFailed) {
                    binding.progressBar.visibility = View.VISIBLE
                }
            }
        }

        binding.retryButton.setOnClickListener { reloadSite() }
        binding.browserButton.setOnClickListener {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(SITE_URL)))
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (binding.webView.canGoBack()) {
                        binding.webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            },
        )

        if (savedInstanceState == null) {
            reloadSite()
        } else {
            binding.webView.restoreState(savedInstanceState)
        }
    }

    private fun reloadSite() {
        mainFrameFailed = false
        binding.errorPanel.visibility = View.GONE
        binding.progressBar.visibility = View.VISIBLE
        binding.webView.loadUrl(SITE_URL)
    }

    private fun showError() {
        mainHandler.removeCallbacks(loadTimeout)
        binding.progressBar.visibility = View.GONE
        binding.errorText.setText(R.string.load_error)
        binding.errorPanel.visibility = View.VISIBLE
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        binding.webView.saveState(outState)
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(loadTimeout)
        binding.webView.apply {
            stopLoading()
            loadUrl("about:blank")
            removeAllViews()
            destroy()
        }
        super.onDestroy()
    }

    companion object {
        private const val SITE_URL = "https://cnd-kohl.vercel.app/"
    }
}
