import Code from "../../Code";
import CodeFunc from "../../CodeFunc";

export default function Drawing(){
    return <div>
        Let's remind ourselves that we are doing dynamic rendering. In older versions of Vulkan, we would need to create framebuffers for our image views and a render pass. 
        With dynamic rendering, we can now render directly to the image views. However, we will now need to specify the color, depth, and stencil attachments when we being rendering.

        <p>Now in order to draw, we need to issue commands. We have to record all the commands we want into command buffer objects, and submit them together.
            Therefore, we need a command buffer. In order to create a command buffer, we will first need to create a command pool that manages the memory for the buffers. 
            Since we now need the queue family index, we move the <CodeFunc>queueIndex</CodeFunc> defined in our logical device creation as a member variable.
        </p>

<Code>
{`vk::raii::CommandPool commandPool = nullptr;

void createCommandPool()
{
    vk::CommandPoolCreateInfo poolInfo{ .flags = vk::CommandPoolCreateFlagBits::eResetCommandBuffer, .queueFamilyIndex = queueIndex };
    commandPool = vk::raii::CommandPool(device, poolInfo);
}`}
</Code>

        We will then have our command buffer.
        
<Code>{
`vk::raii::CommandBuffer commandBuffer = nullptr;

void createCommandBuffer()
{
    vk::CommandBufferAllocateInfo allocInfo{ .commandPool = commandPool, .level = vk::CommandBufferLevel::ePrimary, .commandBufferCount = 1 };
    commandBuffer = std::move(vk::raii::CommandBuffers(device, allocInfo).front());
}`}</Code>

<p>We now have what it is necessary to draw a frame! We can add a function to our main loop.</p>
<Code>{
`void mainLoop()
{
    while (!glfwWindowShouldClose(window))
    {
        glfwPollEvents();
        drawFrame();
    }
}`
}</Code>

<p>Drawing a frame has quite a few steps. We first need to wait for the previous frame to finish. Then acquire a new image from the swap chain. 
    Record the commands that draws onto the image. Submit the commands. Finally present the image.
</p>

<p>Now since acquiring images from the swap chain, submitting commands, and presenting images are done on the GPU, they are asynchronous and we will need synchronization. 
    Thus we will first need semaphores, which controls order between queue operations such as submitting command buffers and presentation queues. Semaphores are either unsignaled or signaled.
    They start as unsignaled. Now we use them by providing the same semaphore as a 'signal' in one queue, and as a 'wait' in another queue.
<Code>
{
`VkCommandBuffer A, B = ... // record command buffers
VkSemaphore S = ... // create a semaphore

// enqueue A, signal S when done - starts executing immediately
vkQueueSubmit(work: A, signal: S, wait: None)

// enqueue B, wait on S to start
vkQueueSubmit(work: B, signal: None, wait: S)`
}

This results in queues in A to finish before starting queues in B. What is important is that these queue submits return instantly.
They don't block our CPU, or the host execution.
</Code>
</p>

<p>
However, semaphores only coordinate between GPU queue operations. We also need to synchronize execution of the CPU as well, which results in using a fence.
We can specify a signal semaphore in our queue operations, and have our fence wait for that semaphore in our execution. This does block host execution.
<Code>
{
`VkCommandBuffer A = ... // record command buffer with the transfer
VkFence F = ... // create the fence

// enqueue A, start work immediately, signal F when done
vkQueueSubmit(work: A, fence: F)

vkWaitForFence(F) // blocks execution until A has finished executing

save_screenshot_to_disk() // can't run until the transfer has finished`
}
</Code>
Furthermore, fences also need to be reset manually by the host. 
</p>

<p>Now if we remind ourselves of our steps to draw a frame, we need to acquire an image to render to from the swapchain.
    This lets us know we can submit commands to render to it, resulting in a semaphore. We also need a semaphore to know when this rendering is done, and we can present it.
    Finally, we also need a fence to make sure only one frame is rendered at a time.
    <Code>{
`vk::raii::Semaphore presentCompleteSemaphore = nullptr;
vk::raii::Semaphore renderFinishedSemaphore = nullptr;
vk::raii::Fence drawFence = nullptr;`}</Code>

We then create these synchronization objects. 

<Code>{
`void initVulkan() {
    createInstance();
    setupDebugMessenger();
    createSurface();
    pickPhysicalDevice();
    createLogicalDevice();
    createSwapChain();
    createImageViews();
    createGraphicsPipeline();
    createCommandPool();
    createCommandBuffer();
    createSyncObjects();
}

void createSyncObjects() {
    presentCompleteSemaphore = vk::raii::Semaphore(device, vk::SemaphoreCreateInfo());
    renderFinishedSemaphore = vk::raii::Semaphore(device, vk::SemaphoreCreateInfo());
    drawFence = vk::raii::Fence(device, {.flags = vk::FenceCreateFlagBits::eSignaled});
}`}</Code>
</p>

<p>
Now when drawing, we first need an image from the framebuffer after the previous frame finished. We can then record our command buffer.
</p>

<p>Recording the command buffer involves transitioning an image's layout to one that is suitable for rendering since Vulkan images can have different layouts optimized for different operations.
We setup a function to transition an image's layout from being undefined to <CodeFunc>VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL</CodeFunc> so we can attach our default colors.

<Code>{
`void transition_image_layout(
	uint32_t                imageIndex,
	vk::ImageLayout         old_layout,
	vk::ImageLayout         new_layout,
	vk::AccessFlags2        src_access_mask,
	vk::AccessFlags2        dst_access_mask,
	vk::PipelineStageFlags2 src_stage_mask,
	vk::PipelineStageFlags2 dst_stage_mask)
{
	vk::ImageMemoryBarrier2 barrier = {
		.srcStageMask = src_stage_mask,
		.srcAccessMask = src_access_mask,
		.dstStageMask = dst_stage_mask,
		.dstAccessMask = dst_access_mask,
		.oldLayout = old_layout,
		.newLayout = new_layout,
		.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
		.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED,
		.image = swapChainImages[imageIndex],
		.subresourceRange = {
			   .aspectMask = vk::ImageAspectFlagBits::eColor,
			   .baseMipLevel = 0,
			   .levelCount = 1,
			   .baseArrayLayer = 0,
			   .layerCount = 1} };
	vk::DependencyInfo dependency_info = {
		.dependencyFlags = {},
		.imageMemoryBarrierCount = 1,
		.pImageMemoryBarriers = &barrier };
	commandBuffer.pipelineBarrier2(dependency_info);
}`}</Code>

We then write our commands, which involves transitioning, attaching, then doing our draw command.
<Code>
{
`void recordCommandBuffer(uint32_t imageIndex)
{
    commandBuffer.begin({});
    // Before starting rendering, transition the swapchain image to COLOR_ATTACHMENT_OPTIMAL
    transition_image_layout(
        imageIndex,
        vk::ImageLayout::eUndefined,
        vk::ImageLayout::eColorAttachmentOptimal,
        {},                                                        // srcAccessMask (no need to wait for previous operations)
        vk::AccessFlagBits2::eColorAttachmentWrite,                // dstAccessMask
        vk::PipelineStageFlagBits2::eColorAttachmentOutput,        // srcStage
        vk::PipelineStageFlagBits2::eColorAttachmentOutput         // dstStage
    );
    vk::ClearValue              clearColor     = vk::ClearColorValue(0.0f, 0.0f, 0.0f, 1.0f);
    vk::RenderingAttachmentInfo attachmentInfo = {
        .imageView   = swapChainImageViews[imageIndex],
        .imageLayout = vk::ImageLayout::eColorAttachmentOptimal,
        .loadOp      = vk::AttachmentLoadOp::eClear,
        .storeOp     = vk::AttachmentStoreOp::eStore,
        .clearValue  = clearColor};
    vk::RenderingInfo renderingInfo = {
        .renderArea           = {.offset = {0, 0}, .extent = swapChainExtent},
        .layerCount           = 1,
        .colorAttachmentCount = 1,
        .pColorAttachments    = &attachmentInfo};

    commandBuffer.beginRendering(renderingInfo);
    commandBuffer.bindPipeline(vk::PipelineBindPoint::eGraphics, *graphicsPipeline);
    commandBuffer.setViewport(0, vk::Viewport(0.0f, 0.0f, static_cast<float>(swapChainExtent.width), static_cast<float>(swapChainExtent.height), 0.0f, 1.0f));
    commandBuffer.setScissor(0, vk::Rect2D(vk::Offset2D(0, 0), swapChainExtent));
    commandBuffer.draw(3, 1, 0, 0);
    commandBuffer.endRendering();
    // After rendering, transition the swapchain image to PRESENT_SRC
    transition_image_layout(
        imageIndex,
        vk::ImageLayout::eColorAttachmentOptimal,
        vk::ImageLayout::ePresentSrcKHR,
        vk::AccessFlagBits2::eColorAttachmentWrite,                // srcAccessMask
        {},                                                        // dstAccessMask
        vk::PipelineStageFlagBits2::eColorAttachmentOutput,        // srcStage
        vk::PipelineStageFlagBits2::eBottomOfPipe                  // dstStage
    );
    commandBuffer.end();
}`}
</Code>

We see that at the end, we also use our transition image function to transition the image to <CodeFunc>VK_IMAGE_LAYOUT_PRESENT_SRC_KHR</CodeFunc> so it can be presented.
</p>

<p>We now use this <CodeFunc>recordCommandBuffer</CodeFunc> in our draw call. After setting up our fences and presenting we get</p>
<Code>{
`void drawFrame()
{
    queue.waitIdle();        // NOTE: for simplicity, wait for the queue to be idle before starting the frame
                                // In the next chapter you see how to use multiple frames in flight and fences to sync

    auto [result, imageIndex] = swapChain.acquireNextImage(UINT64_MAX, *presentCompleteSemaphore, nullptr);
    recordCommandBuffer(imageIndex);

    device.resetFences(*drawFence);
    vk::PipelineStageFlags waitDestinationStageMask(vk::PipelineStageFlagBits::eColorAttachmentOutput);
    const vk::SubmitInfo   submitInfo{.waitSemaphoreCount = 1, .pWaitSemaphores = &*presentCompleteSemaphore, .pWaitDstStageMask = &waitDestinationStageMask, .commandBufferCount = 1, .pCommandBuffers = &*commandBuffer, .signalSemaphoreCount = 1, .pSignalSemaphores = &*renderFinishedSemaphore};
    queue.submit(submitInfo, *drawFence);
    while (vk::Result::eTimeout == device.waitForFences(*drawFence, vk::True, UINT64_MAX))
        ;

    const vk::PresentInfoKHR presentInfoKHR{.waitSemaphoreCount = 1, .pWaitSemaphores = &*renderFinishedSemaphore, .swapchainCount = 1, .pSwapchains = &*swapChain, .pImageIndices = &imageIndex};
    result = queue.presentKHR(presentInfoKHR);
    switch (result)
    {
        case vk::Result::eSuccess:
            break;
        case vk::Result::eSuboptimalKHR:
            std::cout << "vk::Queue::presentKHR returned vk::Result::eSuboptimalKHR !\n";
            break;
        default:
            break;        // an unexpected result is returned!
    }
}`}</Code> 

<p>Now we still have a slight issue when we close our program. Since drawFrame operations are asynchronous, they could still be active when we exit the main loop.
    This ends up cleaning while drawing. We simply need to wait until the device is idle before exiting.
<Code>
{`void mainLoop() {
    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();
        drawFrame();
    }

    device.waitIdle();
}`}
</Code>
</p>

    </div> 
}